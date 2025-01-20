#!/bin/bash

apk add openssl

mkdir -p /vault/tls

openssl req -nodes -newkey rsa:4096 -keyout /vault/tls/vault.key -out /vault/tls/vault.csr \
            -subj "/CN=FR/ST=OpenSSL/L=Paris/O=Dis/CN=127.0.0.1"

openssl x509 -req -days 356 \
            -in /vault/tls/vault.csr \
            -signkey /vault/tls/vault.key \
            -out /vault/tls/vault.crt

vault server -config /vault/config/config.hcl