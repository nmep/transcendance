#!/bin/bash
# Refactored Kibana entrypoint script

#######################################
# Global Configuration
#######################################
VAULT_ADDR="https://vault:8200"
SECRET_DIR="/secret"
SERVICE="Kibana"
SERVICE_LOWER=$(echo "$SERVICE" | tr 'A-Z' 'a-z')
LOG_FILE="/tmp/log/kibana.log"

#######################################
# Logging Functions
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
# Helper Functions
#######################################

# Wait until the stored IP matches the container's current IP.
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

# Wait for the Vault token and return it.
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

# Wait until Vault is unsealed.
wait_for_vault_unseal() {
	local seal="null" attempt=0 max_attempts=30
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

# Fetch a single Vault variable.
fetch_vault_variable() {
	local service_lower="$1" vault_token="$2" var_name="$3"
	local attempt=0 max_attempts=100 value=""
	while true; do
		value=$(curl -s -k --header "X-Vault-Token:$vault_token" "$VAULT_ADDR/v1/secret/data/${service_lower}" | jq -r ".data.data.${var_name}")
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

# Fetch and export multiple Vault variables.
fetch_vault_variables() {
	local service_lower="$1" vault_token="$2"
	shift 2
	for var in "$@"; do
		log_info "⏳" "Setting up $var..."
		value=$(fetch_vault_variable "$service_lower" "$vault_token" "$var")
		export "$var"="$value"
		log_info "✅" "$var has been successfully set, continuing..."
	done
}

# Wait for Elasticsearch readiness by checking the certificate response.
wait_for_es_readiness() {
	while ! curl -s --cacert config/certs/ca/ca.crt https://elastic:9200 | grep -q 'missing authentication credentials'; do
		log_info "⏳" "Waiting for Elasticsearch to be ready..."
		sleep 3
	done
	log_info "✅" "Elasticsearch is now ready!"
}

#######################################
# Main Execution Flow for Kibana
#######################################
main() {
	wait_for_ip_sync
	VAULT_RTOKEN=$(wait_for_vault_token)
	log_info "✅" "Vault token is properly set, continuing..."
	wait_for_vault_unseal
	# Fetch required Vault variables.
	fetch_vault_variables "$SERVICE_LOWER" "$VAULT_RTOKEN" ELASTICSEARCH_USERNAME ELASTICSEARCH_PASSWORD ENCRYPTION_KEY
	unset VAULT_RTOKEN
	export XPACK_SECURITY_ENCRYPTIONKEY="$ENCRYPTION_KEY"
	export XPACK_ENCRYPTEDSAVEDOBJECTS_ENCRYPTIONKEY="$ENCRYPTION_KEY"
	export XPACK_REPORTING_ENCRYPTIONKEY="$ENCRYPTION_KEY"
	wait_for_es_readiness
	# Start kibana_exporter in the background.
	kibana_exporter -kibana.uri http://localhost:5601 -wait -kibana.password "$ELASTICSEARCH_PASSWORD" -kibana.username "$ELASTICSEARCH_USERNAME" &
	log_info "🚀" "Environment variables were properly set using Vault, launching $SERVICE"
	# Start logging services at the end.
	rm -f /tmp/rsyslogd.pid
	rsyslogd -i /tmp/rsyslogd.pid -f /syslog/rsyslog.conf
	/logrotate_script.sh &
	exec "$@" 2>&1 | tee $LOG_FILE
}
main "$@"
