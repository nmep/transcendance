#!/bin/bash

#######################################
# Global configuration
#######################################
VAULT_ADDR="https://vault:8200"
SECRET_DIR="/secret"
SERVICE="Postgres_Exporter"
SERVICE_LOWER=$(echo "$SERVICE" | tr 'A-Z' 'a-z')
LOG_FILE="/tmp/log/postgres_exporter.log"
#######################################
# Logging functions (print to stderr)
# Usage: log_info "⏳" "message" or log_error "❌" "message"
#######################################
log_info() {
    local icon="$1"
    shift
    echo "$icon $@" >&2
}

log_error() {
    local icon="$1"
    shift
    echo "$icon $@" >&2
}

#######################################
# Wait until the stored IP matches the container's current IP.
#######################################
wait_for_ip_sync() {
    local current_ip old_ip ip_file

    ip_file="$SECRET_DIR/ips/${SERVICE_LOWER}_ip.txt"
    if [ -f "$ip_file" ]; then
        old_ip=$(cat $ip_file)
    fi
    current_ip=$(getent hosts "$(hostname)" | awk '{print $1}')
    old_ip=$(cat "$SECRET_DIR/ips/${SERVICE_LOWER}_ip.txt" 2>/dev/null)
    while [ "$current_ip" != "$old_ip" ]; do
        log_info "⏳" "Container's IP has changed ($current_ip vs ${old_ip:-none}), waiting for new token..."
        sleep 2
        old_ip=$(cat "$SECRET_DIR/ips/${SERVICE_LOWER}_ip.txt" 2>/dev/null)
    done
}

#######################################
# Wait for the Vault token to be set and return it.
#######################################
wait_for_vault_token() {
    local token attempt=0 max_attempts=30
    token=$(cat "$SECRET_DIR/${SERVICE_LOWER}_token.txt" 2>/dev/null)
    while [ -z "$token" ]; do
        attempt=$((attempt + 1))
        if [ $attempt -gt $max_attempts ]; then
            log_error "❌" "Couldn't set Vault token within 1 minute, aborting..."
            exit 1
        fi
        log_info "⏳" "Vault token is not set, trying again... (attempt: $attempt)"
        sleep 2
        token=$(cat "$SECRET_DIR/${SERVICE_LOWER}_token.txt" 2>/dev/null)
    done
    echo "$token"
}

#######################################
# Wait for Vault to become unsealed.
#######################################
wait_for_vault_unseal() {
    local attempt=0 max_attempts=30 seal_status=""
    while true; do
        seal_status=$(curl -k -s -f "$VAULT_ADDR/v1/sys/seal-status" | jq -r .sealed)
        if [ "$seal_status" = "false" ]; then
            break
        fi
        attempt=$((attempt + 1))
        if [ $attempt -gt $max_attempts ]; then
            log_error "❌" "Vault is still sealed after a minute, aborting..."
            exit 1
        fi
        log_info "⏳" "Waiting for Vault to unseal... (attempt: $attempt)"
        sleep 2
    done
    log_info "✅" "Vault is unsealed, continuing..."
}

#######################################
# Fetch a variable from Vault and export it.
# Arguments: variable name, service name (lowercase), Vault token.
#######################################
fetch_vault_variable() {
    local var_name="$1"
    local service_lower="$2"
    local vault_token="$3"
    local attempt=0 max_attempts=100 value=""
    while true; do
        value=$(curl -s -k --header "X-Vault-Token:$vault_token" \
            "$VAULT_ADDR/v1/secret/data/${service_lower}" | jq -r ".data.data.${var_name}")
        if [ "$value" != "null" ] && [ -n "$value" ]; then
            break
        fi
        attempt=$((attempt + 1))
        if [ $attempt -gt $max_attempts ]; then
            log_error "❌" "$var_name couldn't be set within a minute, aborting..."
            exit 1
        fi
        log_info "⏳" "Setting up $var_name... (attempt: $attempt)"
        sleep 2
    done
    echo "$value"
}

#######################################
# Wait for PostgreSQL to be ready.
# Arguments: database name, user, host, port.
#######################################
wait_for_pg_connection() {
    local db_name="$1" user="$2" host="$3" port="$4"
    while ! pg_isready -d "$db_name" -h "$host" -p "$port" -U "$user" >/dev/null 2>&1; do
        log_info "⏳" "Database connection not ready, retrying..."
        sleep 2
    done
}

#######################################
# Wait until a given container resolves to an IP address.
# Arguments: container name.
#######################################
wait_for_container_start() {
    local container="$1"
    local attempt=0 max_attempts=12 ip=""
    while [ -z "$ip" ] && [ $attempt -lt $max_attempts ]; do
        ip=$(getent hosts "$container" | awk '{print $1}')
        if [ -z "$ip" ]; then
            attempt=$((attempt + 1))
            log_info "⏳" "Waiting for $container to resolve... attempt $((attempt))"
            sleep 5
        fi
    done
    if [ -z "$ip" ]; then
        log_error "❌" "Failed to resolve $container after 60 seconds. Exiting."
        exit 1
    fi
    log_info "✅" "${container^} container has successfully started."
}

#######################################
# Main execution flow
#######################################
main() {
    # Wait until the IP stored in file matches the container's current IP.
    wait_for_ip_sync

    # Wait for Vault token and capture it.
    VAULT_RTOKEN=$(wait_for_vault_token)
    log_info "✅" "Vault token is properly set, continuing..."

    # Wait for Vault to be unsealed.
    wait_for_vault_unseal

    # Fetch required environment variables from Vault.
    local env_vars=("POSTGRES_DB" "DATA_SOURCE_USER" "DATA_SOURCE_PASSWORD")
    for var in "${env_vars[@]}"; do
        log_info "⏳" "Setting up $var..."
        value=$(fetch_vault_variable "$var" "$SERVICE_LOWER" "$VAULT_RTOKEN")
        export "$var"="$value"
        log_info "✅" "$var has been successfully set, continuing..."
    done

    # Unset the temporary Vault token variable.
    unset VAULT_RTOKEN

    # Construct DATA_SOURCE_NAME from the retrieved variables.
    export DATA_SOURCE_NAME="postgresql://${DATA_SOURCE_USER}:${DATA_SOURCE_PASSWORD}@db:5432/${POSTGRES_DB}?sslmode=disable"
    log_info "✅" "DATA_SOURCE_NAME has been successfully set, continuing..."
    # Wait for PostgreSQL to be available.
    wait_for_pg_connection "$POSTGRES_DB" "$DATA_SOURCE_USER" "db" "5432"

    # Wait for other required containers to be ready.
    local containers=("postgres" "prometheus" "logstash")
    for container in "${containers[@]}"; do
        wait_for_container_start "$container"
    done

    log_info "🚀" "Environment variables were properly set using Vault, launching $SERVICE"

    # Start system logging and log rotation before executing the main command.
    /logrotate_script.sh &

    # Execute the command passed to the container, logging output.
    exec "$@" 2>&1 | tee "$LOG_FILE"
}
main "$@"
