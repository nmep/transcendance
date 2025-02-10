#!/bin/bash

apk add openssl curl

mkdir -p /vault/tls
syslogd -R logstash:514

# verifier si les fichier ssl existe deja

openssl req -nodes -newkey rsa:4096 -keyout /vault/tls/vault.key -out /vault/tls/vault.csr \
            -subj "/CN=FR/ST=OpenSSL/L=Paris/O=Dis/CN=127.0.0.1"

openssl x509 -req -days 356 \
            -in /vault/tls/vault.csr \
            -signkey /vault/tls/vault.key \
            -out /vault/tls/vault.crt

vault server -config /vault/config/config.hcl

echo "Waiting for vault server to be launched..."

until curl -k -s -f https://127.0.0.1:8200; do
    echo attempt failed...
    sleep 2
done

echo "unsealing..."

curl -k -s \
    --request POST \
    --data "{ \"key\" : \"$VAULT_UNSEAL1\"}" \
    https://127.0.0.1:8200/v1/sys/unseal

curl -k -s \
    --request POST \
    --data "{ \"key\" : \"$VAULT_UNSEAL2\"}" \
    https://127.0.0.1:8200/v1/sys/unseal

curl -k -s \
    --request POST \
    --data "{ \"key\" : \"$VAULT_UNSEAL3\"}" \
    https://127.0.0.1:8200/v1/sys/unseal

vault status
echo $VAULT_RTOKEN
unset VAULT_UNSEAL1 VAULT_UNSEAL2 VAULT_UNSEAL3

vault login $VAULT_RTOKEN
vault audit enable syslog -format=json

wait
