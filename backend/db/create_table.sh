#!/bin/bash

# Attendre que PostgreSQL soit prêt

# echo CHECK DE LA TABLE USER

# # Attendre que la table users existe
# until psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1 FROM users LIMIT 1;" >/dev/null 2>&1; do
#     echo "⏳ Attente de la création de la table 'users'..."
#     sleep 2
# done

# echo "✅ La table 'users' existe ! Création de 'refresh_tokens'..."
# psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
# CREATE TABLE IF NOT EXISTS refresh_tokens (
#     id SERIAL PRIMARY KEY,
#     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
#     token TEXT NOT NULL,
#     expires_at TIMESTAMP NOT NULL
# );
# EOF