#!/bin/bash
set -e

# Global configuration
VAULT_ADDR="https://vault:8200"
SECRET_DIR="/secret"
SECRET_JSON="/secrets.json"
SECRETS_ARE_SET_FILE="$SECRET_DIR/secrets_set"
CURL_OPTS="-k"

# Logging functions: require an emoticon as first parameter.
log_info() {
    local icon="$1"
    shift
    echo "$icon $@" >&2
}
log_error() {
    local icon="$1"
    shift
    echo "$icon $@" >&2
}

# Wait for Vault to return a valid initialization status.
# Returns 0 if Vault is initialized, 1 if not.
wait_for_vault() {
    local j=0 init_status=""
    until [ "$init_status" = "true" ] || [ "$init_status" = "false" ]; do
        log_info "⏳" "Waiting for Vault to respond..."
        j=$((j + 1))
        if [ $j -gt 30 ]; then
            log_error "❌" "Vault is not responding after a minute, aborting..."
            exit 1
        fi
        init_status=$(curl -ks -s -f "$VAULT_ADDR/v1/sys/seal-status" | jq -r .initialized)
        if [ "$init_status" != "true" ] && [ "$init_status" != "false" ]; then
            sleep 2
        fi
    done

    if [ "$init_status" = "true" ]; then
        return 0
    else
        return 1
    fi
}

# Wait for Vault to return a valid seal status.
# Returns 0 if Vault is sealed, 1 if unsealed.
wait_for_seal_status() {
    local j=0 seal_status=""
    until [ -n "$seal_status" ] && [ "$seal_status" != "null" ]; do
        j=$((j + 1))
        if [ $j -gt 30 ]; then
            log_error "❌" "Vault is not responding after a minute, aborting..."
            exit 1
        fi
        seal_status=$(curl -ks -s -f "$VAULT_ADDR/v1/sys/seal-status" | jq -r .sealed)
        if [ -z "$seal_status" ] || [ "$seal_status" = "null" ]; then
            sleep 2
        fi
    done

    if [ "$seal_status" = "true" ]; then
        return 0
    else
        return 1
    fi
}

# Unseal Vault using stored unseal keys
unseal_vault() {
    log_info "🔓" "Unsealing Vault..."
    local keys
    keys=$(cat "$SECRET_DIR/unseal_keys.txt")
    for key in $keys; do
        curl -ks --request POST --data "{\"key\": \"$key\"}" "$VAULT_ADDR/v1/sys/unseal" >/dev/null
    done
    log_info "✅" "Vault is now unsealed."
}

# Wait until a service resolves to an IP address (up to 60 sec)
resolve_service_ip() {
    local service=$1 retries=0 max_retries=12 ip=""
    while [ -z "$ip" ] && [ $retries -lt $max_retries ]; do
        ip=$(getent hosts "$service" | awk '{print $1}')
        if [ -z "$ip" ]; then
            log_info "⏳" "Waiting for $service to resolve... attempt $((retries + 1))"
            sleep 5
            retries=$((retries + 1))
        fi
    done
    if [ -z "$ip" ]; then
        log_error "❌" "Failed to resolve $service after 60 seconds. Exiting."
        exit 1
    fi
    echo "$ip"
}

# Update the Vault role and token for a given service if its IP has changed
update_service_token() {
    local service=$1 new_ip stored_ip ip_file policy_name role_name role_payload token_resp token

    new_ip=$(resolve_service_ip "$service")
    ip_file="$SECRET_DIR/ips/${service}_ip.txt"
    if [ -f "$ip_file" ]; then
        stored_ip=$(cat "$ip_file")
    fi

    if [ "$stored_ip" != "$new_ip" ]; then
        log_info "🔄" "${service^} resolved to new IP: $new_ip (previous: ${stored_ip:-none})"
        echo "$new_ip" >"$ip_file"

        policy_name="${service}-policy"
        role_name="${service}-role"

        # Create the policy if it does not exist
        local policy_status
        policy_status=$(curl $CURL_OPTS --silent --output /dev/null --write-out "%{http_code}" \
            --header "X-Vault-Token: $ROOT_TOKEN" \
            "$VAULT_ADDR/v1/sys/policies/acl/$policy_name")
        if [ "$policy_status" -eq 404 ]; then
            log_info "📝" "Policy $policy_name does not exist. Creating it..."
            local policy_content="path \\\"secret/data/${service}*\\\" { capabilities = [\\\"read\\\", \\\"list\\\"] }"
            curl $CURL_OPTS --silent --header "X-Vault-Token: $ROOT_TOKEN" \
                --request PUT \
                --data "{\"policy\": \"$policy_content\"}" \
                "$VAULT_ADDR/v1/sys/policies/acl/$policy_name" >/dev/null
        else
            log_info "ℹ️" "Policy $policy_name already exists; skipping creation."
        fi

        # Create or update the token role with a 5-minute TTL and bind_ip set to the new IP
        role_payload=$(jq -n \
            --arg allowed_policies "$policy_name" \
            --arg bound_cidrs "$new_ip/32" \
            --arg ttl "5m" \
            '{allowed_policies: $allowed_policies, bound_cidrs: $bound_cidrs, ttl: $ttl}')
        log_info "🔄" "Updating role $role_name..."
        curl $CURL_OPTS --silent --header "X-Vault-Token: $ROOT_TOKEN" \
            --request PUT \
            --data "$role_payload" \
            "$VAULT_ADDR/v1/auth/token/roles/$role_name" >/dev/null

        # Create a token using the role
        log_info "🔑" "Creating token for role $role_name..."
        token_resp=$(curl $CURL_OPTS --silent --header "X-Vault-Token: $ROOT_TOKEN" \
            --request POST \
            "$VAULT_ADDR/v1/auth/token/create/$role_name")
        token=$(echo "$token_resp" | jq -r '.auth.client_token')
        if [ -z "$token" ]; then
            log_error "❌" "Failed to create token for $service"
            exit 1
        fi
        echo "$token" >"$SECRET_DIR/${service}_token.txt"
        log_info "💾" "Token for $service stored in $SECRET_DIR/${service}_token.txt"
    else
        log_info "👍" "${service^} IP unchanged ($new_ip); no update required."
    fi
}

# Process each service defined in the secrets JSON:
# If secrets have not been stored yet, send them to Vault.
# Always update the service token if necessary.
process_services() {
    local secrets_json
    secrets_json=$(cat "$SECRET_JSON")
    echo "$secrets_json" | jq -c '.services | to_entries[]' | while read -r entry; do
        local service secret_data vault_path
        service=$(echo "$entry" | jq -r '.key')
        secret_data=$(echo "$entry" | jq -c '.value')
        vault_path="secret/data/${service}"

        if [ ! -f "$SECRETS_ARE_SET_FILE" ]; then
            log_info "🚀" "Storing secrets for service: $service"
            curl $CURL_OPTS --silent --header "X-Vault-Token: $ROOT_TOKEN" \
                --request POST \
                --data "{\"data\": $secret_data}" \
                "$VAULT_ADDR/v1/$vault_path" >/dev/null
            log_info "✅" "Secrets for $service stored in Vault."
        fi

        update_service_token "$service"
    done
}

# Main execution flow
main() {
    mkdir -p /vault/data "$SECRET_DIR/ips"

    # Wait for Vault to respond and determine if it is initialized.
    if wait_for_vault; then
        log_info "✅" "Vault is already initialized."
        # Check seal status and unseal if necessary.
        if wait_for_seal_status; then
            unseal_vault
        else
            log_info "👍" "Vault is already unsealed."
        fi
    else
        log_info "🚀" "Initializing Vault..."
        local init_output unseal_keys
        init_output=$(curl -sk --request POST "$VAULT_ADDR/v1/sys/init" --data '{"secret_shares": 3, "secret_threshold": 2}')
        echo "$init_output" >"$SECRET_DIR/init_output.json"

        unseal_keys=$(echo "$init_output" | jq -r '.keys[]')
        ROOT_TOKEN=$(echo "$init_output" | jq -r '.root_token')
        echo "$unseal_keys" >"$SECRET_DIR/unseal_keys.txt"
        echo "$ROOT_TOKEN" >"$SECRET_DIR/root_token.txt"
        chmod 400 "$SECRET_DIR/root_token.txt"
        unseal_vault
    fi

    # Ensure we have the root token loaded.
    if [ -z "$ROOT_TOKEN" ]; then
        ROOT_TOKEN=$(cat "$SECRET_DIR/root_token.txt")
    fi

    # Mount the secrets engine (assumes kv-v2)
    curl $CURL_OPTS --silent --header "X-Vault-Token: $ROOT_TOKEN" \
        --request POST --data '{"type":"kv-v2"}' "$VAULT_ADDR/v1/sys/mounts/secret" >/dev/null

    # Run external configuration checks
    ./check_requirements.sh
    if [ $? -ne 0 ]; then
        log_error "❌" "Configuration error, stopping container."
        exit 1
    fi

    # Process each service: store secrets (if needed) and update tokens based on IP changes.
    process_services

    if [ ! -f "$SECRETS_ARE_SET_FILE" ]; then
        touch "$SECRETS_ARE_SET_FILE"
        log_info "✅" "Secrets initialization complete."
    else
        log_info "✅" "Secrets already set; updated tokens if necessary."
    fi

}
main "$@"

log_info "🔄" "Starting periodic Vault seal monitoring loop..."
while true; do
    if wait_for_seal_status; then
        log_info "🔄" "Vault is sealed. Attempting to unseal..."
        unseal_vault
    else
        log_info "👍" "Vault is unsealed."
    fi
    # For each service defined in the secrets JSON, update its token based on current IP.
    for service in $(jq -r '.services | keys[]' "$SECRET_JSON"); do
        if [ "$service" != "setup_elk" ]; then
            update_service_token "$service"
        fi
    done
    sleep 30
done
