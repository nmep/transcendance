#!/bin/bash

service="Logstash"
service_lower=$(echo $service | tr A-Z a-z)
current_ip=$(getent hosts $service_lower | awk '{print $1}')
old_ip=$(cat /secret/ips/${service_lower}_ip.txt 2>/dev/null)
until [ "$current_ip" = "$old_ip" ]; do
	echo "Container's ip has changed, waiting for new token"
	old_ip=$(cat /secret/ips/${service_lower}_ip.txt 2>/dev/null)
	sleep 2
done
touch .env
#Checking for vault token
VAULT_RTOKEN=$(cat /secret/${service_lower}_token.txt 2>/dev/null)
j=0
while [ x"$VAULT_RTOKEN" = x ]; do
	j=$((j + 1))
	if [ $j -gt 30 ]; then
		echo "❌ Couldn't set Vault token within 1 minute, aborting..."
		exit 1
	fi
	VAULT_RTOKEN=$(cat /secret/${service_lower}_token.txt 2>/dev/null)
	if [ x"$VAULT_RTOKEN" = x ]; then
		echo "⏳ Vault token is not set, trying again..."
		sleep 2
	else
		break
	fi
done
echo "✅ Vault token is properly set, continuing..."

#Checking for vault seal
seal="null"
j=0
while [ "$seal" = "null" ] || [ "$seal" = "true" ]; do
	echo "⏳ Waiting for vault to unseal..."
	j=$((j + 1))
	if [ $j -gt 30 ]; then
		echo "❌ Vault is still sealed after a minute, aborting..."
		exit 1
	fi
	seal=$(curl -k -s -f https://vault:8200/v1/sys/seal-status | jq -r .sealed)
	if [ "$seal" = "null" ] || [ "$seal" = "true" ]; then
		sleep 2
	else
		break
	fi
done
echo "✅ Vault is unsealed, continuing..."
echo "⏳ Waiting for Vault content..."
while read var; do
	j=0
	echo "⏳ Setting up $var..."
	var_content="null"
	while [ "$var_content" = "null" ] || [ -z "$var_content" ]; do
		j=$((j + 1))
		if [ $j -gt 100 ]; then
			echo "❌ $var couldn't be set within a minute, aborting..."
			exit 1
		fi
		export $var=$(curl -s -k \
			--header "X-Vault-Token:$VAULT_RTOKEN" \
			https://vault:8200/v1/secret/data/${service_lower} |
			jq -r .data.data.$var)
		var_content=$(eval "echo \${$var}")
		if [ "$var_content" = "null" ] || [ -z "$var_content" ]; then
			sleep 2
		else
			break
		fi
	done
	echo "✅ $var has been successfully set, continuing..."
done <<EOVARS
ELASTIC_USER
ELASTIC_PASSWORD
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
EOVARS
unset VAULT_RTOKEN
until curl -s --cacert certs/ca/ca.crt https://elastic:9200 | grep -q 'missing authentication credentials'; do
	echo "Waiting for Elasticsearch to be ready..."
	sleep 3
done
echo "Elasticsearch is now ready !"
until curl -s -I http://kibana:5601 | grep -q 'HTTP/1.1 302 Found'; do
	echo "Wait for Kibana to be ready..."
	sleep 3
done
echo "Kibana is now ready !"
/usr/share/logstash/lib/logstash-exporter &
echo "🚀 Environment variables were properly set using Vault, launching $service"

exec "$@"
