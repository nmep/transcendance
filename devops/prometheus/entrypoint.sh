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
    current_ip=$(getent hosts "$(hostname)" | awk '{print $1}')
    old_ip=$(cat "$SECRET_DIR/ips/${SERVICE_LOWER}_ip.txt" 2>/dev/null)
    while [ "$current_ip" != "$old_ip" ]; do
        log_info "⏳" "Container's IP has changed ($current_ip vs ${old_ip:-none}), waiting for new token..."
        sleep 2
        old_ip=$(cat "$SECRET_DIR/ips/${SERVICE_LOWER}_ip.txt" 2>/dev/null)
        current_ip=$(getent hosts "$(hostname)" | awk '{print $1}')
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
    log_info "✅" "Vault Token has properly been set !"
    echo "$token"
}

create_cert() {
    #!/bin/bash
    local PATH_TO_CERT="/etc/prometheus/cert/prometheus/certificate"

    if [ -f "$PATH_TO_CERT.crt" ] && [ -f "$PATH_TO_CERT.key" ]; then
        echo "Certificate already exists! Skipping..."
    else
        echo "Generating certificate..."
        # Remove any existing certificate/key files (if present)
        rm -f "$PATH_TO_CERT.crt" "$PATH_TO_CERT.key"

        # Create a CSR and a new 2048-bit RSA key using your configuration file.
        openssl req -new -nodes -out /tmp/prometheus.csr -newkey rsa:2048 -keyout /tmp/prometheus.key -config /etc/prometheus/openssl.cnf

        # Self-sign the certificate using the CSR and key, referencing the correct extension section.
        openssl x509 -req -in /tmp/prometheus.csr -signkey /tmp/prometheus.key -out "$PATH_TO_CERT.crt" -days 365 -extensions v3_req -extfile /etc/prometheus/openssl.cnf

        # Move the private key to its destination.
        mv /tmp/prometheus.key "$PATH_TO_CERT.key"

        # Clean up the CSR
        rm -f /tmp/prometheus.csr

        echo "Certificate has been successfully generated!"

        # Set file permissions
        chmod 644 "$PATH_TO_CERT.crt"
        chmod 600 "$PATH_TO_CERT.key"
    fi

}

wait_for_grafana_cert() {
    local PATH_TO_GRAFANA_CERT="/etc/prometheus/cert/grafana/certificate"
    until [ -f "$PATH_TO_GRAFANA_CERT.crt" ] && [ -f "$PATH_TO_GRAFANA_CERT.key" ]; do
        log_info "⏳" "Waiting for Grafana's certificate..."
        sleep 2
    done
    log_info "✅" "Grafana's certificate has properly been created !"
}

wait_for_vault_cert() {
    local PATH_TO_VAULT_CERT="/etc/prometheus/cert/vault/vault"
    until [ -f "$PATH_TO_VAULT_CERT.crt" ] && [ -f "$PATH_TO_VAULT_CERT.key" ]; do
        log_info "⏳" "Waiting for Vault's certificate..."
        sleep 2
    done
    log_info "✅" "Vault's certificate has properly been created !"
}

export PROM_TOKEN=$(wait_for_vault_token)
create_cert
wait_for_grafana_cert
wait_for_vault_cert
/logrotate_script.sh &
exec "$@" 2>&1 | tee $LOG_FILE
