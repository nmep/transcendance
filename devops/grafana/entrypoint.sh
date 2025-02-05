#!/bin/bash

while [[ $(curl -k -s -f https://vault:8200/v1/sys/seal-status | jq -r .sealed) = "true" ]]; do
    echo Waiting for vault to unseal...
    sleep 2
done

while [ -z "$GF_SECURITY_ADMIN_PASSWORD" ] || [ "$GF_SECURITY_ADMIN_PASSWORD" = "null" ] ; do
	sleep 2
	export GF_SECURITY_ADMIN_PASSWORD=$(curl -s -k \
									--header "X-Vault-Token:$VAULT_RTOKEN" \
									https://vault:8200/v1/secret/grafana \
									| jq -r .data.GF_SECURITY_ADMIN_PASSWORD)
done
while [ -z "$GF_SECURITY_ADMIN_USER" ] || [ "$GF_SECURITY_ADMIN_USER" = "null" ] ; do
	sleep 2
	export GF_SECURITY_ADMIN_USER=$(curl -s -k \
									--header "X-Vault-Token:$VAULT_RTOKEN" \
									https://vault:8200/v1/secret/grafana \
									| jq -r .data.GF_SECURITY_ADMIN_USER)
done

unset VAULT_RTOKEN

exec "$@"