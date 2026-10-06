FROM debian:bookworm

RUN apt update && apt install -y nginx openssl && apt clean && rm -rf /var/lib/apt/lists/*

COPY tools/init.sh /usr/local/bin/init.sh

RUN chmod +x /usr/local/bin/init.sh

ENTRYPOINT ["/usr/local/bin/init.sh"]
