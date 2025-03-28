#!/bin/bash

GF_SECURITY_ADMIN_PASSWORD=$(curl -k -s --header "$VAULT_RTOKEN" \
  --request GET https://vault:8200/v1/secret/grafana | jq -r .data.GF_SECURITY_ADMIN_PASSWORD)

GF_SECURITY_ADMIN_USER=$(curl -k -s --header "$VAULT_RTOKEN" \
  --request GET https://vault:8200/v1/secret/grafana | jq -r .data.GF_SECURITY_ADMIN_USER)

echo GF_SECURITY_ADMIN_PASSWORD = $GF_SECURITY_ADMIN_PASSWORD
echo GF_SECURITY_ADMIN_USER = $GF_SECURITY_ADMIN_USER

export GF_SECURITY_ADMIN_PASSWORD GF_SECURITY_ADMIN_USER

exec grafana server