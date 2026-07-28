COMPOSE = docker compose

.PHONY: all up down build logs clean re ps migrate studio

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

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down -v --remove-orphans
	docker system prune -f

re: clean all
