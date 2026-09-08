COMPOSE = docker compose

.PHONY: all up down build logs clean re ps migrate studio lint

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

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down -v --remove-orphans
	docker system prune -f

re: clean all
