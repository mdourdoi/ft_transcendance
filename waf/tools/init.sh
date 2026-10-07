#!/bin/bash

set -e

mkdir -p /etc/nginx/ssl

if [ ! -f /etc/nginx/ssl/nginx.crt ] ; then
	openssl req -x509 -newkey rsa:2048 -noenc -days 365 \
		-out /etc/nginx/ssl/nginx.crt -keyout /etc/nginx/ssl/nginx.key \
		-subj "/C=FR/L=Lyon/O=42/CN=localhost" \
		-addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi

exec nginx -g "daemon off;"
