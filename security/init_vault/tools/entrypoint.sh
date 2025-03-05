#!/bin/bash

CURL_OPTS="-k"

unseal_vault() {
    echo "🔓 Unsealing Vault..."
    UNSEAL_KEYS=$(cat $SECRET_DIR/unseal_keys.txt)

    for KEY in $UNSEAL_KEYS; do
        curl -ks --request POST --data "{\"key\": \"$KEY\"}" $VAULT_ADDR/v1/sys/unseal >/dev/null
    done

    echo "✅ Vault is now unsealed."
}

checking_vault() {
    echo "❓Checking Vault status..."
    j=0
    until [ "$initialized" = "true" ] || [ "$initialized" = "false" ]; do
        echo "⏳ Waiting for Vault to answer..."
        j=$((j + 1))
        if [ $j -gt 30 ]; then
            echo "❌ Vault is not responding after a minute, aborting..."
            exit 1
        fi
        initialized=$(curl -k -s -f $VAULT_ADDR/v1/sys/seal-status | jq -r .initialized)
        if [ "$initialized" = "true" ] || [ "$initialized" = "false" ]; then
            break
        else
            sleep 2
        fi
    done
}

checking_seal() {
    SEAL="null"
    while [ "$SEAL" = "null" ] || [ -z "$SEAL" ]; do
        j=$((j + 1))
        if [ $j -gt 30 ]; then
            echo "❌ Vault is not responding after a minute, aborting..."
            exit 1
        fi
        SEAL=$(curl -k -s -f $VAULT_ADDR/v1/sys/seal-status | jq -r .sealed)
        if [ "$SEAL" = "null" ] || [ -z "$SEAL" ]; then
            sleep 2
        else
            break
        fi
    done
    if [ "$SEAL" = "true" ]; then
        unseal_vault
    else
        echo "✅ Vault is already unsealed."
    fi
}

create_token() {
    echo "Processing service: $1"

    # Wait until the service's IP is resolvable, trying up to 60 seconds (12 attempts)
    retries=0
    max_retries=12
    ip=""
    while [ x"$ip" = x ] && [ $retries -lt $max_retries ]; do
        ip=$(getent hosts "$1" | awk '{print $1}')
        if [ x"$ip" = x ]; then
            echo "Waiting for $1 to resolve... attempt $((retries + 1))"
            sleep 5
            retries=$((retries + 1))
        fi
    done

    if [ x"$ip" = x ]; then
        echo "Error: Failed to resolve $1 after 60 seconds. Exiting."
        exit 1
    fi
    echo "$1 resolved to IP: $ip"

    # Define names for policy and role
    policy_name="${1}-policy"
    role_name="${1}-role"

    # Check if the policy exists
    policy_status=$(curl $CURL_OPTS --silent --output /dev/null --write-out "%{http_code}" \
        --header "X-Vault-Token: $ROOT_TOKEN" \
        "$VAULT_ADDR/v1/sys/policies/acl/$policy_name")
    echo policy $policy_status status
    if [ "$policy_status" -eq 404 ]; then
        echo "Policy $policy_name does not exist. Creating it..."
        # Create a read-only policy for the service's secrets (read & list only)
        policy_content="path \\\"secret/data/${1}/*\\\" { capabilities = [\\\"read\\\", \\\"list\\\"] }"
        curl $CURL_OPTS --silent --header "X-Vault-Token: $ROOT_TOKEN" \
            --request PUT \
            --data "{\"policy\": \"$policy_content\"}" \
            "$VAULT_ADDR/v1/sys/policies/acl/$policy_name"

    else
        echo "Policy $policy_name already exists; skipping creation."
    fi

    # Create or update the token role with a 5-minute TTL and bind_ip set to the service IP
    role_payload=$(jq -n \
        --arg allowed_policies "$policy_name" \
        --arg bound_cidrs "$ip/32" \
        --arg ttl "5m" \
        '{allowed_policies: $allowed_policies, bound_cidrs: $bound_cidrs, ttl: $ttl}')
    echo "Creating/updating role $role_name..."
    curl $CURL_OPTS --silent --header "X-Vault-Token: $ROOT_TOKEN" \
        --request PUT \
        --data "$role_payload" \
        "$VAULT_ADDR/v1/auth/token/roles/$role_name" >/dev/null

    # Create a token using the role with TTL of 5 minutes
    echo "Creating token for role $role_name..."
    token_resp=$(curl $CURL_OPTS --silent --header "X-Vault-Token: $ROOT_TOKEN" \
        --request POST \
        "$VAULT_ADDR/v1/auth/token/create/$role_name")
    token=$(echo "$token_resp" | jq -r '.auth.client_token')
    if [ x"$token" = x ]; then
        echo "Failed to create token for $1" >&2
        exit 1
    fi

    token_file="$SECRET_DIR/${1}_token.txt"
    echo "$token" >"$token_file"
    echo "Token for $1 stored in $token_file"
}

SECRET_DIR="/secret"
SECRET_JSON="/secrets.json"
SECRETS_ARE_SET_FILE="$SECRET_DIR/secrets_set"
VAULT_ADDR="https://vault:8200"
mkdir -p /vault/data $SECRET_DIR

if [ -f "$SECRETS_ARE_SET_FILE" ]; then
    echo "✅ Initialization process already done !"
    checking_vault
    checking_seal
    exit 0
fi

./check_requirements.sh
if [[ $? -ne 0 ]]; then
    echo "❌ Configuration error, stopping container."
    exit 1
fi

checking_vault
j=0
if [ "$initialized" = "true" ]; then
    echo "✅ Vault is already initialized. Checking seal..."
    checking_seal
else
    echo "🚀 Initializing Vault..."
    INIT_OUTPUT=$(curl -sk --request POST $VAULT_ADDR/v1/sys/init --data '{"secret_shares": 3, "secret_threshold": 2}')
    echo "$INIT_OUTPUT" >$SECRET_DIR/init_output.json

    UNSEAL_KEYS=$(echo $INIT_OUTPUT | jq -r '.keys[]')
    ROOT_TOKEN=$(echo $INIT_OUTPUT | jq -r '.root_token')

    echo "$UNSEAL_KEYS" >$SECRET_DIR/unseal_keys.txt
    echo "$ROOT_TOKEN" >$SECRET_DIR/root_token.txt

    unseal_vault
fi

echo "🔐 Adding secrets to Vault..."
ROOT_TOKEN=$(cat $SECRET_DIR/root_token.txt)
curl -sk --header "X-Vault-Token: $ROOT_TOKEN" --request POST --data '{"type":"kv-v2"}' $VAULT_ADDR/v1/sys/mounts/secret >/dev/null

SECRETS_JSON=$(cat $SECRET_JSON)
echo "$SECRETS_JSON" | jq -c '.services | to_entries[]' | while read -r entry; do
    SERVICE=$(echo "$entry" | jq -r '.key')
    SECRET_DATA=$(echo "$entry" | jq -c '.value')

    VAULT_PATH="secret/data/$SERVICE"

    echo "📤 Sending secrets for service : $SERVICE"

    # Envoi des secrets dans Vault via API
    curl -sk --header "X-Vault-Token: $ROOT_TOKEN" \
        --request POST \
        --data "{\"data\": $SECRET_DATA}" \
        "$VAULT_ADDR/v1/$VAULT_PATH" >/dev/null

    echo "✅ ${SERVICE^}'s secrets successfully sent to Vault !"
    create_token $SERVICE
done
echo "✅ All secrets added."
#IL FAUDRA PENSER A SUPPRIMER LE JSON DES SECRETS ICI

echo "✅ Initialization done !"
touch "$SECRETS_ARE_SET_FILE"
sleep infinity
