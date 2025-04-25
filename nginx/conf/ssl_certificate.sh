#!/bin/bash

CERT="/etc/nginx/ssl/www.Mickeytracendence.com.crt"

if [ ! -f "$CERT" ]; then
	echo "Creating ssl certificate..."
	openssl req -new -newkey rsa:4096 -nodes \
		-keyout /etc/nginx/ssl/www.Mickeytracendence.com.key -out /etc/nginx/ssl/www.Mickeytracendence.com.csr \
		-subj "/C=FR/ST=42/L=Paris/O=Dis/CN=www.Mickeytracendence.com"

	openssl x509 -req -days 365 \
		-in /etc/nginx/ssl/www.Mickeytracendence.com.csr \
		-signkey /etc/nginx/ssl/www.Mickeytracendence.com.key \
		-out $CERT
else
	echo "Certificate has already been created, skipping."
fi
exec "$@"
