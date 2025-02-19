#!/bin/bash
set -e

echo "Création de l'utilisateur pour PostgreSQL Exporter..."
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
CREATE USER $EXPORTER_USER WITH PASSWORD '$EXPORTER_PASSWORD';
GRANT CONNECT ON DATABASE $POSTGRES_DB TO $EXPORTER_USER;
GRANT USAGE ON SCHEMA public TO $EXPORTER_USER;
GRANT SELECT ON pg_stat_database TO $EXPORTER_USER;
GRANT SELECT ON pg_stat_bgwriter TO $EXPORTER_USER;
GRANT SELECT ON pg_stat_user_tables TO $EXPORTER_USER;
GRANT SELECT ON pg_stat_user_indexes TO $EXPORTER_USER;
GRANT SELECT ON pg_stat_activity TO $EXPORTER_USER;
GRANT ALL ON FUNCTION pg_catalog.pg_ls_waldir() TO $EXPORTER_USER;
EOF

echo "Création de l'utilisateur pour Auth..."

psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
CREATE USER $AUTH_USER WITH PASSWORD '$AUTH_PASSWORD';

CREATE SCHEMA auth_schema AUTHORIZATION $AUTH_USER;

GRANT CREATE ON SCHEMA auth_schema TO $AUTH_USER;

ALTER ROLE $AUTH_USER SET search_path TO auth_schema;

REVOKE ALL ON SCHEMA public FROM $AUTH_USER;

ALTER DEFAULT PRIVILEGES FOR ROLE $AUTH_USER IN SCHEMA auth_schema
GRANT ALL ON TABLES TO $AUTH_USER;
EOF

echo "Configuration de l'utilisateur Auth terminée."

echo "Configuration terminée."
