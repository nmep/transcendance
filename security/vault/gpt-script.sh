#!/bin/bash
set -euo pipefail

# Use -k flag for insecure HTTPS (remove if certificates are valid)
CURL_OPTS="-k"

# Define Vault environment variables (ensure these are exported in your environment)
# export VAULT_ADDR=https://vault.example.com:8200
# export VAULT_ROOT_TOKEN=your_root_token

# List of services (one per line)
read -r -d '' SERVICES <<'EOF'
service1.example.com
service2.example.com
service3.example.com
EOF

for service in $SERVICES; do
    echo "Processing service: $service"

    # Wait until the service's IP is resolvable, trying up to 60 seconds (12 attempts)
    retries=0
    max_retries=12
    ip=""
    while [ -z "$ip" ] && [ $retries -lt $max_retries ]; do
        ip=$(getent hosts "$service" | awk '{print $1}')
        if [ -z "$ip" ]; then
            echo "Waiting for $service to resolve... attempt $((retries + 1))"
            sleep 5
            retries=$((retries + 1))
        fi
    done

    if [ -z "$ip" ]; then
        echo "Error: Failed to resolve $service after 60 seconds. Exiting."
        exit 1
    fi
    echo "$service resolved to IP: $ip"

    # Define names for policy and role
    policy_name="${service}-policy"
    role_name="${service}-role"

    # Check if the policy exists
    policy_status=$(curl $CURL_OPTS --silent --output /dev/null --write-out "%{http_code}" \
        --header "X-Vault-Token: $VAULT_ROOT_TOKEN" \
        "$VAULT_ADDR/v1/sys/policies/acl/$policy_name")

    if [ "$policy_status" -eq 404 ]; then
        echo "Policy $policy_name does not exist. Creating it..."
        # Create a read-only policy for the service's secrets (read & list only)
        policy_content="path \"secret/data/${service}/*\" { capabilities = [\"read\", \"list\"] }"
        curl $CURL_OPTS --silent --header "X-Vault-Token: $VAULT_ROOT_TOKEN" \
            --request PUT \
            --data "{\"policy\": \"$policy_content\"}" \
            "$VAULT_ADDR/v1/sys/policies/acl/$policy_name"
    else
        echo "Policy $policy_name already exists; skipping creation."
    fi

    # Create or update the token role with a 5-minute TTL and bind_ip set to the service IP
    role_payload=$(jq -n \
        --arg allowed_policies "$policy_name" \
        --arg bind_ip "$ip" \
        --arg token_ttl "5m" \
        '{allowed_policies: $allowed_policies, bind_ip: $bind_ip, token_ttl: $token_ttl}')

    echo "Creating/updating role $role_name..."
    curl $CURL_OPTS --silent --header "X-Vault-Token: $VAULT_ROOT_TOKEN" \
        --request PUT \
        --data "$role_payload" \
        "$VAULT_ADDR/v1/auth/token/roles/$role_name" >/dev/null

    # Create a token using the role with TTL of 5 minutes
    echo "Creating token for role $role_name..."
    token_resp=$(curl $CURL_OPTS --silent --header "X-Vault-Token: $VAULT_ROOT_TOKEN" \
        --request POST \
        --data "{\"role\": \"$role_name\", \"ttl\": \"5m\"}" \
        "$VAULT_ADDR/v1/auth/token/create")

    token=$(echo "$token_resp" | jq -r '.auth.client_token')
    if [ "$token" = "null" ] || [ -z "$token" ]; then
        echo "Failed to create token for $service" >&2
        exit 1
    fi

    token_file="${service}_token.txt"
    echo "$token" >"$token_file"
    echo "Token for $service stored in $token_file"
done
