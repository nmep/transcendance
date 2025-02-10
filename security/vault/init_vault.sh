#!/bin/sh

apk add curl jq
VAULT_ADDR="https://vault:8200"
SECRETS_FILE="/vault/data/secrets_set"
mkdir -p /vault/data
echo "Vérification de l'état de Vault..."
if curl -s $VAULT_ADDR/v1/sys/health | grep -q '"initialized":true'; then
    echo "✅ Vault est déjà initialisé. Vérification du descellage..."
    if curl -s $VAULT_ADDR/v1/sys/seal-status | grep -q '"sealed":true'; then
        echo "🔓 Descèlement de Vault..."
        UNSEAL_KEYS=$(cat /vault/data/unseal_keys.txt)
        for KEY in $UNSEAL_KEYS; do
            curl -sk --request POST --data "{\"key\": \"$KEY\"}" $VAULT_ADDR/v1/sys/unseal > /dev/null
        done
        echo "✅ Vault est maintenant ouvert."
    else
        echo "✅ Vault est déjà descellé."
    fi
else
    echo "🚀 Initialisation de Vault..."
    INIT_OUTPUT=$(curl -sk --request POST $VAULT_ADDR/v1/sys/init --data '{"secret_shares": 3, "secret_threshold": 2}')
    echo "$INIT_OUTPUT" > /vault/data/init_output.json

    UNSEAL_KEYS=$(echo $INIT_OUTPUT | jq -r '.keys[]')
    ROOT_TOKEN=$(echo $INIT_OUTPUT | jq -r '.root_token')

    echo "$UNSEAL_KEYS" > /vault/data/unseal_keys.txt
    echo "$ROOT_TOKEN" > /vault/data/root_token.txt

    echo "🔓 Descèlement de Vault..."
    for KEY in $UNSEAL_KEYS; do
        curl -sk --request POST --data "{\"key\": \"$KEY\"}" $VAULT_ADDR/v1/sys/unseal > /dev/null
    done
    echo "✅ Vault est maintenant ouvert."
fi

if [ -f "$SECRETS_FILE" ]; then
    echo "✅ Les secrets sont déjà en place."
else
    echo "🔐 Ajout des secrets dans Vault..."
    ROOT_TOKEN=$(cat /vault/data/root_token.txt)
    curl -sk --header "X-Vault-Token: $ROOT_TOKEN" --request POST --data '{"type":"kv-v2"}' $VAULT_ADDR/v1/sys/mounts/secret

    curl -sk --header "X-Vault-Token: $ROOT_TOKEN" --request POST --data '{"data":{"API_KEY":"123456", "SECRET_KEY":"abcdef"}}' $VAULT_ADDR/v1/secret/data/app

    echo "✅ Secrets ajoutés."
    touch "$SECRETS_FILE"
fi

echo "📜 Vérification de l'activation du logging audit..."
if ! curl -sk --header "X-Vault-Token: $ROOT_TOKEN" $VAULT_ADDR/v1/sys/audit | grep -q "syslog"; then
    echo "📝 Activation du logging audit sur Syslog..."
    curl -sk --header "X-Vault-Token: $ROOT_TOKEN" --request PUT --data '{"type":"syslog"}' $VAULT_ADDR/v1/sys/audit/syslog
    echo "✅ Audit syslog activé."
else
    echo "✅ L'audit syslog est déjà activé."
fi

echo "✅ Initialisation terminée."
