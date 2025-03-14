#!/bin/bash
set -e
CERT_DIR="/vault/tls"
CERT_FILE="$CERT_DIR/vault.crt"
KEY_FILE="$CERT_DIR/vault.key"
CA_FILE="$CERT_DIR/ca.crt"
DAYS_VALID=365
VAULT_HOST="vault.local"
/logrotate_script.sh &
# Création du dossier si non existant
mkdir -p $CERT_DIR

# Vérification si le certificat existe déjà
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
	echo "✅ SSL Certificate already created"
else
	echo "🔐 Generating self-signed certificate for Vault..."

	# Génération de la clé privée
	openssl genpkey -algorithm RSA -out "$KEY_FILE"

	# Génération de la requête de certificat (CSR)
	openssl req -new -key "$KEY_FILE" -out "$CERT_DIR/vault.csr" -subj "/CN=$VAULT_HOST"

	# Génération d'un certificat auto-signé
	openssl x509 -req -in "$CERT_DIR/vault.csr" -signkey "$KEY_FILE" -out "$CERT_FILE" -days "$DAYS_VALID"

	# Création d'un CA auto-signé (si besoin)
	cp "$CERT_FILE" "$CA_FILE"

	echo "✅ Certificate successfully created at : $CERT_DIR"
fi
exec "$@"
