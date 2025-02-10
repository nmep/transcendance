#!/bin/sh

unseal_vault() {
    echo "🔓 Unsealing Vault..."
    UNSEAL_KEYS=$(cat $SECRET_DIR/unseal_keys.txt)

    for KEY in $UNSEAL_KEYS; do
        curl -ks --request POST --data "{\"key\": \"$KEY\"}" $VAULT_ADDR/v1/sys/unseal > /dev/null
    done

    echo "✅ Vault is now unsealed."
}

SECRET_DIR="/secret"
SECRETS_FILE="$SECRET_DIR/secrets_set"
if [ -f "$SECRETS_FILE" ]; then
    echo "✅ Initialization process already done !"
    exit 0
fi

apk add curl jq
VAULT_ADDR="https://vault:8200"
mkdir -p /vault/data


echo "Checking Vault status..."
j=0
until [ "$initialized" = "true" ] || [ "$initialized" = "false" ]; do
    echo "⏳ Waiting for Vault to answer..."
	j=$((j+1))
	if  [ $j -gt 30 ]; then
			echo "❌ Vault is not responding after a minute, aborting..."
			exit 1
	fi
	initialized=$(curl -k -s -f $VAULT_ADDR/v1/sys/seal-status | jq -r .initialized)
    sleep 2
done

j=0
if [ "$initialized" = "true" ]; then
    echo "✅ Vault is already initialized. Checking seal..."
    seal="null"
    while [ "$seal" = "null" ] || [ -z "$seal" ]; do
        j=$((j+1))
        if  [ $j -gt 30 ]; then
                echo "❌ Vault is not responding after a minute, aborting..."
                exit 1
        fi
        seal=$(curl -k -s -f https://vault:8200/v1/sys/seal-status | jq -r .sealed)
        sleep 2
    done
    if [ "$seal" = "true" ]; then
        unseal_vault
    else
        echo "✅ Vault est déjà descellé."
    fi
else
    echo "🚀 Initialisation de Vault..."
    INIT_OUTPUT=$(curl -sk --request POST $VAULT_ADDR/v1/sys/init --data '{"secret_shares": 3, "secret_threshold": 2}')
    echo "$INIT_OUTPUT" > $SECRET_DIR/init_output.json

    UNSEAL_KEYS=$(echo $INIT_OUTPUT | jq -r '.keys[]')
    ROOT_TOKEN=$(echo $INIT_OUTPUT | jq -r '.root_token')

    echo "$UNSEAL_KEYS" > $SECRET_DIR/unseal_keys.txt
    echo "$ROOT_TOKEN" > $SECRET_DIR/root_token.txt

    unseal_vault
fi

echo "🔐 Ajout des secrets dans Vault..."
ROOT_TOKEN=$(cat $SECRET_DIR/root_token.txt)
curl -sk --header "X-Vault-Token: $ROOT_TOKEN" --request POST --data '{"type":"kv-v2"}' $VAULT_ADDR/v1/sys/mounts/secret > /dev/null

curl -sk --header "X-Vault-Token: $ROOT_TOKEN" --request POST --data '{"data":{"API_KEY":"123456", "SECRET_KEY":"abcdef"}}' $VAULT_ADDR/v1/secret/data/app > /dev/null

echo "✅ Secrets ajoutés."
echo "📝 Activation du logging audit sur Syslog..."
curl -sk --header "X-Vault-Token: $ROOT_TOKEN" --request PUT --data '{"type":"syslog"}' $VAULT_ADDR/v1/sys/audit/syslog
echo "✅ Audit syslog activé."
echo "✅ Initialisation terminée."
touch "$SECRETS_FILE"
