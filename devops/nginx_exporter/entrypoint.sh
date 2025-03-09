#!/bin/bash
wait_for_start() {
    retries=0
    max_retries=12
    ip=""
    while [ x"$ip" = x ] && [ $retries -lt $max_retries ]; do
        ip=$(getent hosts "$1" | awk '{print $1}')
        if [ x"$ip" = x ]; then
            echo "Waiting for $1 to resolve... attempt $((retries + 1))"
            sleep 5
            retries=$((retries + 1))
        fi
    done

    if [ x"$ip" = x ]; then
        echo "Error: Failed to resolve $1 after 60 seconds. Exiting."
        exit 1
    fi
    echo ${1^} container has successfully started.
}

read -r -d '' containers <<'EOF'
nginx
prometheus
logstash
EOF
for container in $containers; do
    wait_for_start $container
done
/logrotate_script.sh &
exec "$@" 2>&1 | tee /tmp/log/nginx_exporter.log
