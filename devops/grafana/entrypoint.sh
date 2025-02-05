#!/bin/bash

while [ $(curl -k -s -f https://vault:8200/v1/sys/seal-status | jq -r .sealed) == "true" ]; do
    echo waiting for vault...
    sleep 2
done

sleep 2

export GF_SECURITY_ADMIN_PASSWORD=$(curl -s -k \
									--header "X-Vault-Token:$VAULT_RTOKEN" \
									https://vault:8200/v1/secret/grafana \
									| jq -r .data.GF_SECURITY_ADMIN_PASSWORD)

export GF_SECURITY_ADMIN_USER=$(curl -s -k \
									--header "X-Vault-Token:$VAULT_RTOKEN" \
									https://vault:8200/v1/secret/grafana \
									| jq -r .data.GF_SECURITY_ADMIN_USER)

echo niqueprout ${GF_SECURITY_ADMIN_PASSWORD} $GF_SECURITY_ADMIN_USER
unset VAULT_RTOKEN

exec "$@"