#!/bin/bash

service="Grafana"
service_lower=$(echo $service | tr A-Z a-z)
#Checking for vault token

if [ -z "$VAULT_RTOKEN" ]; then
	echo "Vault token is not set, aborting..."
	exit 1
fi
echo "Vault token is properly set, continuing..."

#Checking for vault seal
seal="null"
j=0
while [ "$seal" = "null" ] || [ "$seal" = "true" ]; do
    echo "Waiting for vault to unseal..."
	j=$((j+1))
	if  [ $j -gt 30 ]; then
			echo "Vault is still sealed after a minute, aborting..."
			exit 1
	fi
	seal=$(curl -k -s -f https://vault:8200/v1/sys/seal-status | jq -r .sealed)
    sleep 2
done
echo "Vault is unsealed, continuing..."
#Error count
while read var; do
	j=0
	var_content="null"
	while [ "$var_content" = "null" ]; do
		echo "Waiting for vault content..."
		sleep 2
		j=$((j+1))
		if  [ $j -gt 30 ]; then
			echo "$var couldn't be set within a minute, aborting..."
			exit 1
		fi
		export $var=$(curl -s -k \
									--header "X-Vault-Token:$VAULT_RTOKEN" \
									https://vault:8200/v1/secret/${service_lower} \
									| jq -r .data.$var)
		var_content=$(eval "echo \${$var}")
	done
	echo "$var has been successfully set, continuing..."
done << EOVARS
GF_SECURITY_ADMIN_PASSWORD
GF_SECURITY_ADMIN_USER
EOVARS
unset VAULT_RTOKEN
echo "Environment variables were properly set using vault, launching $service"
exec "$@"