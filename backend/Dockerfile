FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY . .

RUN npm run build

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
EXPOSE 5555

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]
