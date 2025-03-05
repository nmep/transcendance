#!/bin/bash

service="Auth"
service_lower=$(echo $service | tr A-Z a-z)
rsyslogd -f /rsyslog.conf
#Checking for vault token
VAULT_RTOKEN=$(cat /secret/root_token.txt 2>/dev/null)
j=0
while [ x"$VAULT_RTOKEN" = x ]; do
	j=$((j + 1))
	if [ $j -gt 30 ]; then
		echo "❌ Couldn't set Vault token within 1 minute, aborting..."
		exit 1
	fi
	VAULT_RTOKEN=$(cat /secret/root_token.txt 2>/dev/null)
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
#Error count
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
POSTGRES_DB
AUTH_USER
AUTH_PASSWORD
EOVARS
unset VAULT_RTOKEN

until pg_isready -d $POSTGRES_DB -h db -p 5432 -U $AUTH_USER >/dev/null; do
	echo "Connexion to database didn't succeed, retrying..."
	sleep 2
done

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
postgres
logstash
EOF
for container in $containers; do
	wait_for_start $container
done
echo "🚀 Environment variables were properly set using Vault, launching $service"

exec "$@"
