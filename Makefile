COMPOSE = docker compose

.PHONY: all up down build logs clean re ps migrate studio lint bruno

all: up

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build --no-cache

logs:
	$(COMPOSE) logs -f

migrate:
	$(COMPOSE) exec backend npx prisma db push

studio:
	$(COMPOSE) exec backend npx prisma studio

lint:
	$(COMPOSE) build backend
	$(COMPOSE) run --rm --no-deps -T --entrypoint npm backend run lint:check

bruno:
	docker run --rm --network host -v "$(CURDIR)/bruno":/collection:ro node:22-alpine sh -c '\
		cp -r /collection /tmp/bruno && cd /tmp/bruno && \
		npm ci --silent && npm i -g --silent @usebruno/cli && \
		bru run --sandbox developer'

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down -v --remove-orphans
	docker system prune -f

re: clean all
