#!/bin/bash

apk add openssl curl

mkdir -p /vault/tls

openssl req -nodes -newkey rsa:4096 -keyout /vault/tls/vault.key -out /vault/tls/vault.csr \
            -subj "/CN=FR/ST=OpenSSL/L=Paris/O=Dis/CN=127.0.0.1"

openssl x509 -req -days 356 \
            -in /vault/tls/vault.csr \
            -signkey /vault/tls/vault.key \
            -out /vault/tls/vault.crt

vault server -config /vault/config/config.hcl &

echo "Waiting for vault server to be launched..."

until curl -k -f https://127.0.0.1:8200; do
    echo attempt failed...
    sleep 2
done

echo "unsealing..."


echo "{ \"key\" : \"$VAULT_UNSEAL1\"}"

echo ICI 1

curl -k \
    --request POST \
    --data "{ \"key\" : \"$VAULT_UNSEAL1\"}" \
    https://127.0.0.1:8200/v1/sys/unseal

echo ICI 2

curl -k \
    --request POST \
    --data "{ \"key\" : \"$VAULT_UNSEAL2\"}" \
    https://127.0.0.1:8200/v1/sys/unseal

echo ICI 3

curl -k \
    --request POST \
    --data "{ \"key\" : \"$VAULT_UNSEAL3\"}" \
    https://127.0.0.1:8200/v1/sys/unseal


wait
