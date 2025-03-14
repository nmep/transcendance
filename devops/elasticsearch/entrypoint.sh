#!/bin/bash

#######################################
# Global Configuration
#######################################
VAULT_ADDR="https://vault:8200"
SECRET_DIR="/secret"
SERVICE="Elastic"
SERVICE_LOWER=$(echo "$SERVICE" | tr 'A-Z' 'a-z')
LOG_FILE="/tmp/log/elastic.log"

#######################################
# Logging Functions (write to stderr)
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
	current_ip=$(getent hosts "$SERVICE_LOWER" | awk '{print $1}')
	old_ip=$(cat "$SECRET_DIR/ips/${SERVICE_LOWER}_ip.txt" 2>/dev/null)
	while [ "$current_ip" != "$old_ip" ]; do
		log_info "⏳" "Container's IP has changed ($current_ip vs ${old_ip:-none}), waiting for new token..."
		sleep 2
		old_ip=$(cat "$SECRET_DIR/ips/${SERVICE_LOWER}_ip.txt" 2>/dev/null)
		current_ip=$(getent hosts "$SERVICE_LOWER" | awk '{print $1}')
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
	local seal attempt=0 max_attempts=30
	seal="null"
	while [ "$seal" = "null" ] || [ "$seal" = "true" ]; do
		log_info "⏳" "Waiting for vault to unseal... (attempt: $((attempt + 1)))"
		sleep 2
		attempt=$((attempt + 1))
		if [ $attempt -gt $max_attempts ]; then
			log_error "❌" "Vault is still sealed after a minute, aborting..."
			exit 1
		fi
		seal=$(curl -k -s -f "$VAULT_ADDR/v1/sys/seal-status" | jq -r .sealed)
	done
	log_info "✅" "Vault is unsealed, continuing..."
}

#######################################
# Fetch a variable from Vault.
# Arguments: variable name, Vault token.
#######################################
fetch_vault_variable() {
	local var_name="$1"
	local vault_token="$2"
	local attempt=0 max_attempts=100 value=""
	while true; do
		value=$(curl -s -k --header "X-Vault-Token:$vault_token" "$VAULT_ADDR/v1/secret/data/${SERVICE_LOWER}" | jq -r ".data.data.${var_name}")
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
# Wait until the required certificate file exists.
#######################################
wait_for_certificate() {
	local cert_file="/usr/share/elasticsearch/config/certs/elasticsearch/elasticsearch.crt"
	while [ ! -f "$cert_file" ]; do
		log_info "⏳" "Waiting for certificate at $cert_file..."
		sleep 1
	done
}

#######################################
# Main execution flow
#######################################
main() {
	# Ensure container's IP hasn't changed.
	wait_for_ip_sync

	# Wait for Vault token and capture it.
	VAULT_RTOKEN=$(wait_for_vault_token)
	log_info "✅" "Vault token is properly set, continuing..."

	# Wait for Vault to become unsealed.
	wait_for_vault_unseal

	# Fetch required environment variables from Vault.
	local env_vars=("ELASTIC_PASSWORD" "ELASTIC_USER")
	for var in "${env_vars[@]}"; do
		log_info "⏳" "Setting up $var..."
		value=$(fetch_vault_variable "$var" "$VAULT_RTOKEN")
		export "$var"="$value"
		log_info "✅" "$var has been successfully set, continuing..."
	done

	# Unset the temporary Vault token.
	unset VAULT_RTOKEN

	# Set Elasticsearch environment variables.
	export ES_URI="https://localhost:9200"
	export ES_USERNAME="$ELASTIC_USER"
	export ES_PASSWORD="$ELASTIC_PASSWORD"
	export ES_SSL_SKIP_VERIFY=true

	# Start elasticsearch_exporter in the background.
	elasticsearch_exporter --es.ssl-skip-verify --es.uri=https://localhost:9200 &

	# Wait for the Elasticsearch certificate to be available.
	wait_for_certificate

	log_info "🚀" "Environment variables were properly set using Vault, launching $SERVICE"

	# Start system logging and log rotation just before executing the main container process.
	/logrotate_script.sh &

	# Execute the docker-entrypoint.
	exec /bin/tini -s -- /usr/local/bin/docker-entrypoint.sh "$@" 2>&1 | tee "$LOG_FILE"
}
main "$@"
