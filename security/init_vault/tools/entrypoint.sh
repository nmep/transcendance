#!/bin/bash

unseal_vault() {
    echo "🔓 Unsealing Vault..."
    UNSEAL_KEYS=$(cat $SECRET_DIR/unseal_keys.txt)

    for KEY in $UNSEAL_KEYS; do
        curl -ks --request POST --data "{\"key\": \"$KEY\"}" $VAULT_ADDR/v1/sys/unseal >/dev/null
    done

    echo "✅ Vault is now unsealed."
}

SECRET_DIR="/secret"
SECRET_JSON="/secrets.json"
SECRETS_FILE="$SECRET_DIR/secrets_set"
if [ -f "$SECRETS_FILE" ]; then
    echo "✅ Initialization process already done !"
    exit 0
fi

if [ ! -f "$SECRET_JSON" ]; then
    echo "❌ Please provide secrets .json file !"
    exit 1
fi

VAULT_ADDR="https://vault:8200"
mkdir -p /vault/data $SECRET_DIR

echo "Checking Vault status..."
j=0
until [ "$initialized" = "true" ] || [ "$initialized" = "false" ]; do
    echo "⏳ Waiting for Vault to answer..."
    j=$((j + 1))
    if [ $j -gt 30 ]; then
        echo "❌ Vault is not responding after a minute, aborting..."
        exit 1
    fi
    initialized=$(curl -k -s -f $VAULT_ADDR/v1/sys/seal-status | jq -r .initialized)
    sleep 2
done

j=0
if [ "$initialized" = "true" ]; then
    echo "✅ Vault is already initialized. Checking seal..."
    SEAL="null"
    while [ "$SEAL" = "null" ] || [ -z "$SEAL" ]; do
        j=$((j + 1))
        if [ $j -gt 30 ]; then
            echo "❌ Vault is not responding after a minute, aborting..."
            exit 1
        fi
        SEAL=$(curl -k -s -f https://vault:8200/v1/sys/seal-status | jq -r .sealed)
        sleep 2
    done
    if [ "$SEAL" = "true" ]; then
        unseal_vault
    else
        echo "✅ Vault is already unsealed."
    fi
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
curl -sk --header "X-Vault-Token: $ROOT_TOKEN" --request POST --data '{"type":"kv-v2"}' $VAULT_ADDR/v1/sys/mounts/secret

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
        "$VAULT_ADDR/v1/$VAULT_PATH"

    echo "✅ ${SERVICE^}'s secrets successfully sent to Vault !"
done
echo "✅ All secrets added."

echo "📝 Activating syslogs for Vault..."
curl -sk --header "X-Vault-Token: $ROOT_TOKEN" --request PUT --data '{"type":"syslog"}' $VAULT_ADDR/v1/sys/audit/syslog
echo "✅ Syslog activated !"
echo "✅ Initialization done !"
touch "$SECRETS_FILE"
