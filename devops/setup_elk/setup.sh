#!/bin/bash

KIBANA_SET=/kibana_set/kibana
if [ ! -f config/certs/ca.zip ]; then
    echo "Creating CA"
    bin/elasticsearch-certutil ca --silent --pem -out config/certs/ca.zip
    unzip config/certs/ca.zip -d config/certs
fi
if [ ! -f config/certs/certs.zip ]; then
    echo "Creating certs"
    echo -ne \
        "instances:\n" \
        "  - name: elasticsearch\n" \
        "    dns:\n" \
        "      - elasticsearch\n" \
        "      - localhost\n" \
        "      - elastic\n" \
        "    ip:\n" \
        "      - 127.0.0.1\n" \
        "  - name: kibana\n" \
        "    dns:\n" \
        "      - kibana\n" \
        "      - localhost\n" \
        "    ip:\n" \
        "      - 127.0.0.1\n" \
        >config/certs/instances.yml
    bin/elasticsearch-certutil cert --silent --pem -out config/certs/certs.zip --in config/certs/instances.yml --ca-cert config/certs/ca/ca.crt --ca-key config/certs/ca/ca.key
    unzip config/certs/certs.zip -d config/certs
    echo "Setting file permissions"
    chown -R 1000:0 config/certs
    find . -type d -exec chmod 750 \{\} \;
    find . -type f -exec chmod 640 \{\} \;
fi
echo "Waiting for Elasticsearch availability"
until curl -s --cacert config/certs/ca/ca.crt https://elasticsearch:9200 | grep -q "missing authentication credentials"; do sleep 5; done
if [ ! -f "$KIBANA_SET" ]; then
    echo "Setting kibana_system password"
    until curl -s -X POST --cacert config/certs/ca/ca.crt -u "elastic:${ELASTIC_PASSWORD}" -H "Content-Type: application/json" https://elasticsearch:9200/_security/user/kibana_system/_password -d "{\"password\":\"${KIBANA_PASSWORD}\"}" | grep -q "^{}"; do sleep 1; done
fi
touch $KIBANA_SET
echo "All done!"
