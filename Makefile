COMPOSE = docker compose

.PHONY: all up down build logs clean re ps migrate studio lint test bruno

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
	$(COMPOSE) exec backend sh -c 'node -e "const net=require(\"net\");net.createServer((c)=>{const u=net.connect(5555,\"127.0.0.1\");c.pipe(u).pipe(c);c.on(\"error\",()=>u.destroy());u.on(\"error\",()=>c.destroy());}).listen(5555,process.argv[1])" "$$(hostname -i)" & trap "kill $$!" EXIT INT TERM; npx prisma studio --port 5555 --browser none'

lint:
	$(COMPOSE) build backend
	$(COMPOSE) run --rm --no-deps -T --entrypoint npm backend run lint:check

test:
	$(COMPOSE) build backend
	$(COMPOSE) run --rm --no-deps -T --entrypoint npm backend test

bruno:
	docker run --rm --network host -v "$(CURDIR)/bruno":/collection:ro node:22-alpine sh -c '\
		cp -r /collection /tmp/bruno && cd /tmp/bruno && \
		npm ci --silent && npm i -g --silent @usebruno/cli && \
		bru run --sandbox developer --insecure'

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down -v --remove-orphans
	docker system prune -f

re: clean all
