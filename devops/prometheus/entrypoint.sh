#!/bin/bash

#######################################
# Global Configuration
#######################################
VAULT_ADDR="https://vault:8200"
SECRET_DIR="/secret"
SERVICE="Prometheus"
SERVICE_LOWER=$(echo "$SERVICE" | tr 'A-Z' 'a-z')
LOG_FILE="/tmp/log/prometheus.log"

#######################################
# Logging Functions
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

export PROM_TOKEN=$(wait_for_vault_token)
rm -f /tmp/rsyslogd.pid
rsyslogd -i /tmp/rsyslogd.pid -f /syslog/rsyslog.conf
/logrotate_script.sh &
exec "$@" >>$LOG_FILE 2>&1
