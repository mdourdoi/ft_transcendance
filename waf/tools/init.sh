#!/bin/bash

set -e

mkdir -p /etc/nginx/ssl

if [ ! -f /etc/nginx/ssl/nginx.crt ] ; then
	openssl req -x509 -newkey rsa:2048 -noenc -days 365 \
		-out /etc/nginx/ssl/nginx.crt -keyout /etc/nginx/ssl/nginx.key \
		-subj "/C=FR/L=Lyon/O=42/CN=localhost" \
		-addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi

cat > /etc/nginx/nginx.conf <<EOF
events {}

http {
	include /etc/nginx/mime.types;

	map \$http_upgrade \$connection_upgrade {
		default upgrade;
		''      close;
	}

	server {
		listen 443 ssl;
		ssl_protocols TLSv1.2 TLSv1.3;
		ssl_certificate /etc/nginx/ssl/nginx.crt;
		ssl_certificate_key /etc/nginx/ssl/nginx.key;
		server_name _;

		location /api/ {
			proxy_pass http://backend:3000;
			proxy_set_header Host \$host;
			proxy_set_header X-Real-IP \$remote_addr;
			proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
			proxy_set_header X-Forwarded-Proto https;
		}

		location /socket.io/ {
			proxy_pass http://backend:3000;
			proxy_http_version 1.1;
			proxy_set_header Upgrade \$http_upgrade;
			proxy_set_header Connection \$connection_upgrade;
			proxy_set_header Host \$host;
			proxy_read_timeout 3600s;
		}

		location / {
			proxy_pass http://frontend:5173;
			proxy_http_version 1.1;
			proxy_set_header Upgrade \$http_upgrade;
			proxy_set_header Connection \$connection_upgrade;
			proxy_set_header Host \$host;
		}
	}
}
EOF

exec nginx -g "daemon off;"
