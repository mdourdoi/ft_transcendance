FROM debian:bookworm

RUN apt update && apt install -y nginx openssl libnginx-mod-http-modsecurity modsecurity-crs && apt clean && rm -rf /var/lib/apt/lists/*

COPY conf/nginx.conf /etc/nginx/nginx.conf
COPY conf/modsec/ /etc/nginx/modsec/

COPY tools/init.sh /usr/local/bin/init.sh

RUN chmod +x /usr/local/bin/init.sh

ENTRYPOINT ["/usr/local/bin/init.sh"]
