## Ticket

Closes # <!-- remove "Closes" if it doesnt fully resolves the issue -->

## Description

Adds the matchmaking queue system (ranked and unranked) and the matches module.

- **Redis**: new `redis` service in `docker-compose.yml` (with healthcheck and volume), `RedisModule` client, and `REDIS_HOST` / `REDIS_PORT` env vars.
- **Queue**: `QueueService` stores ranked and unranked queues in Redis. `MatchmakingService` runs every 1.5s behind a Redis lock:
  - unranked pairs players in join order.
  - ranked pairs each player with the closest-rated opponent. The allowed rating gap starts at 50, grows by 20/s of waiting and is capped at 1000.
- **WebSocket gateway** (`/queue` namespace): JWT auth on connection (`auth.token` or `Authorization: Bearer`), `queue.join` / `queue.leave` events, and `queue.joined`, `queue.left`, `queue.matched` emitted to clients. Players leave every queue on disconnect.
- **Scaling**: `RedisIoAdapter` so the gateway works across multiple backend instances.
- **Matches**: new `Match` model (mode, status, players, winner). `POST /matches/:id/result` lets a player report the winner. Ranked matches update both players' Elo (K = 32).
- **Users**: new `rating` field (default 1000) and match relations.
- New error codes: `INVALID_QUEUE_MODE`, `MATCH_NOT_FOUND`.

## Type of change

<!-- Check the relevant option(s) -->

- [ ] Bug fix
- [x] New feature
- [ ] Refactoring (no functional change)
- [ ] Documentation
- [ ] Other (please describe):

## How has this been tested?

<!-- Describe the tests you ran to verify your changes -->
