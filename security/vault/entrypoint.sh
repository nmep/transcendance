#!/bin/bash

apk add openssl curl

mkdir -p /vault/tls
syslogd -R logstash:514

# verifier si les fichier ssl existe deja

#!/bin/bash

CERT_DIR="/vault/tls"
CERT_FILE="$CERT_DIR/vault.crt"
KEY_FILE="$CERT_DIR/vault.key"
CA_FILE="$CERT_DIR/ca.crt"
DAYS_VALID=365
VAULT_HOST="vault.local"

# Création du dossier si non existant
mkdir -p $CERT_DIR

# Vérification si le certificat existe déjà
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo "✅ Certificat SSL déjà en place. Aucune action requise."
else
    echo "🔐 Génération du certificat SSL auto-signé pour Vault..."

    # Génération de la clé privée
    openssl genpkey -algorithm RSA -out "$KEY_FILE"

    # Génération de la requête de certificat (CSR)
    openssl req -new -key "$KEY_FILE" -out "$CERT_DIR/vault.csr" -subj "/CN=$VAULT_HOST"

    # Génération d'un certificat auto-signé
    openssl x509 -req -in "$CERT_DIR/vault.csr" -signkey "$KEY_FILE" -out "$CERT_FILE" -days "$DAYS_VALID"

    # Création d'un CA auto-signé (si besoin)
    cp "$CERT_FILE" "$CA_FILE"

    echo "✅ Certificat généré et enregistré dans : $CERT_DIR"
fi
exec "$@"