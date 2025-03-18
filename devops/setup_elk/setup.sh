#!/bin/bash
# Refactored startup script for Elasticsearch and Kibana with ILM policy setup

#######################################
# Global Configuration
#######################################
KIBANA_SET="/kibana_set/kibana"
ES_URL="https://elasticsearch:9200"
KIBANA_URL="https://kibana:5601"
CA_CERT="config/certs/ca/ca.crt"
CA_KEY="config/certs/ca/ca.key"
CA_ZIP="config/certs/ca.zip"
CERTS_ZIP="config/certs/certs.zip"
INSTANCES_YML="config/certs/instances.yml"
# Credentials are expected to be passed via environment variables:
#   ELASTIC_PASSWORD, KIBANA_PASSWORD
ELASTIC_USER="elastic"
KIBANA_CONF_SET="/usr/share/logstash/data/kibana_conf_sent"
NDJSON_FILE="/usr/share/logstash/config/kibana_config.ndjson"

#######################################
# Logging Functions
#######################################
log_info() {
    echo "⏳ $@"
}
log_success() {
    echo "✅ $@"
}
log_error() {
    echo "❌ $@"
}

#######################################
# Certificate Setup Functions
#######################################
create_ca() {
    if [ ! -f "$CA_ZIP" ]; then
        log_info "Creating CA"
        bin/elasticsearch-certutil ca --silent --pem -out "$CA_ZIP"
        unzip "$CA_ZIP" -d config/certs
    else
        log_info "CA already exists"
    fi
}

create_certs() {
    if [ ! -f "$CERTS_ZIP" ]; then
        log_info "Creating certs"
        cat <<EOF >"$INSTANCES_YML"
instances:
  - name: elasticsearch
    dns:
      - elasticsearch
      - localhost
      - elastic
    ip:
      - 127.0.0.1
  - name: kibana
    dns:
      - kibana
      - localhost
    ip:
      - 127.0.0.1
EOF
        bin/elasticsearch-certutil cert --silent --pem -out "$CERTS_ZIP" \
            --in "$INSTANCES_YML" \
            --ca-cert "$CA_CERT" --ca-key "$CA_KEY"
        unzip "$CERTS_ZIP" -d config/certs
        log_info "Setting file permissions for certs"
        chown -R 1000:0 config/certs
        find . -type d -exec chmod 750 {} \;
        find . -type f -exec chmod 640 {} \;
    else
        log_info "Certs already exist"
    fi
}

#######################################
# Service Wait Functions
#######################################
wait_for_es() {
    log_info "Waiting for Elasticsearch availability"
    until curl -s --cacert "$CA_CERT" -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" "$ES_URL" | grep -q "missing authentication credentials"; do
        echo $ELASTIC_USER $ELASTIC_PASSWORD $ES_URL
        sleep 5
    done
    log_success "Elasticsearch is available"
}

set_kibana_password() {
    if [ ! -f "$KIBANA_SET" ]; then
        log_info "Setting kibana_system password"
        until curl -s -X POST --cacert "$CA_CERT" -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
            -H "Content-Type: application/json" \
            "$ES_URL/_security/user/kibana_system/_password" \
            -d "{\"password\":\"${KIBANA_PASSWORD}\"}" | grep -q "^{}"; do
            sleep 1
        done
        touch "$KIBANA_SET"
        log_success "Kibana system password set"
    else
        log_info "Kibana system password already set"
    fi
}

create_ilm_policy() {
    log_info "Creating ILM policy"
    read -r -d '' ILM_POLICY_JSON <<'EOF'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "7d",
            "max_size": "50gb"
          }
        }
      },
      "warm": {
        "actions": {
          "forcemerge": {
            "max_num_segments": 1
          },
          "shrink": {
            "number_of_shards": 1
          }
        }
      },
      "cold": {
        "actions": {
          "freeze": {}
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
EOF
    curl -s -X PUT --cacert "$CA_CERT" -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
        "$ES_URL/_ilm/policy/my_common_policy" \
        -H "Content-Type: application/json" \
        -d "$ILM_POLICY_JSON" &&
        log_success "ILM policy created" || log_error "Failed to create ILM policy"
}

create_index_template() {
    log_info "Creating index template for all indices"
    read -r -d '' TEMPLATE_JSON <<'EOF'
{
  "index_patterns": [
    "vault*",
    "prometheus-*",
    "postgres_exporter-*",
    "postgres-*",
    "nginx_exporter-*",
    "nginx-*",
    "kibana-*",
    "grafana-*",
    "elastic-*"
  ],
  "template": {
    "settings": {
      "index.lifecycle.name": "my_common_policy",
      "index.lifecycle.rollover_alias": "common_alias"
    }
  }
}
EOF
    curl -s -X PUT --cacert "$CA_CERT" -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
        "$ES_URL/_index_template/common_policy_template" \
        -H "Content-Type: application/json" \
        -d "$TEMPLATE_JSON" &&
        log_success "Index template created" || log_error "Failed to create index template"
}

wait_for_kibana() {
    log_info "Waiting for Kibana to be ready"
    until curl -s -I --cacert "$CA_CERT" "$KIBANA_URL" | grep -q 'HTTP/1.1 302 Found'; do
        sleep 3
    done
    log_success "Kibana is ready"
    if [ ! -f "$KIBANA_CONF_SET" ]; then
        log_info "Importing Kibana configuration"
        curl -s -X POST --cacert "$CA_CERT" \
            "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
            -H "kbn-xsrf: true" -F file=@"$NDJSON_FILE" \
            -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" &&
            log_success "Kibana configuration imported" || log_error "Kibana configuration import failed"
        touch "$KIBANA_CONF_SET"
    fi
}

#######################################
# Main Execution Flow
#######################################
main() {
    create_ca
    create_certs
    wait_for_es
    set_kibana_password
    create_ilm_policy
    create_index_template
    wait_for_kibana
    log_success "All done!"
}

main "$@"
