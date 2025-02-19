#!/bin/bash

service="Logstash"
service_lower=$(echo $service | tr A-Z a-z)
#Checking for vault token
VAULT_RTOKEN=$(cat /secret/root_token.txt 2>/dev/null)
j=0
while [ -z "$VAULT_RTOKEN" ]; do
	j=$((j + 1))
	if [ $j -gt 30 ]; then
		echo "❌ Couldn't set Vault token within 1 minute, aborting..."
		exit 1
	fi
	VAULT_RTOKEN=$(cat /secret/root_token.txt 2>/dev/null)
	if [ -z "$VAULT_RTOKEN" ]; then
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
#Error count
echo "⏳ Waiting for Vault content..."
while read var; do
	j=0
	echo "⏳ Setting up $var..."
	var_content="null"
	while [ "$var_content" = "null" ]; do
		sleep 2
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
		if [ "$var_content" = "null" ]; then
			sleep 2
		else
			break
		fi
	done
	echo "✅ $var has been successfully set => $var_content, continuing..."
done <<EOVARS
ELASTIC_USER
ELASTIC_PASSWORD
EOVARS
unset VAULT_RTOKEN
echo "🚀 Environment variables were properly set using Vault, launching $service"

exec "$@"
