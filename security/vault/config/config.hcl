log_level = "info"
log_format = "json"
log_file = "/tmp/log/vault.log"
ui            = true
disable_mlock = true

cluster_addr  = "https://127.0.0.1:8201"
api_addr      = "https://127.0.0.1:8200"

storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_disable   = "false"
  tls_cert_file = "/vault/tls/vault.crt"
  tls_key_file  = "/vault/tls/vault.key"
}

telemetry {
  # Enables Vault to expose Prometheus‑formatted metrics.
  disable_hostname = true
}
