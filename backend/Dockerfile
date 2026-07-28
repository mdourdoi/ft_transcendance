FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client openssl

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN npm run build

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
EXPOSE 5555

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main"]
