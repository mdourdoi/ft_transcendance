import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { QueueMode } from '../generated/prisma/client.js';
import { Server, Socket } from 'socket.io';
import { resolveCorsOrigin } from '../common/cors.js';
import { ErrorCode } from '../common/error-codes.js';
import {
  authenticateSocket,
  releaseSocket,
  requireSocketUser,
} from '../common/socket-auth.js';
import { MatchesService } from '../matches/matches.service.js';
import { UsersService } from '../users/users.service.js';
import { JoinQueueDto } from './dto/join-queue.dto.js';
import { MatchmakingService } from './matchmaking.service.js';
import { QueueService } from './queue.service.js';

const MATCHMAKING_TICK_MS = 1500;

@WebSocketGateway({ namespace: '/queue', cors: { origin: resolveCorsOrigin } })
export class QueueGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QueueGateway.name);
  private tickInterval?: NodeJS.Timeout;
  private ticking = false;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly matchesService: MatchesService,
    private readonly queueService: QueueService,
    private readonly matchmakingService: MatchmakingService,
  ) {}

  onModuleInit() {
    this.tickInterval = setInterval(() => {
      void this.tick();
    }, MATCHMAKING_TICK_MS);
  }

  onModuleDestroy() {
    clearInterval(this.tickInterval);
  }

  async handleConnection(client: Socket) {
    try {
      authenticateSocket(this.jwtService, client);
    } catch {
      client.disconnect(true);
    }
  }

  @OnEvent('user.deleted')
  async handleUserDeleted(userId: number) {
    await this.queueService.leaveAllModes(userId);
    this.server.in(`user:${userId}`).disconnectSockets(true);
  }

  async handleDisconnect(client: Socket) {
    releaseSocket(client);
    const userId = client.data.userId as number | undefined;
    if (userId === undefined) {
      return;
    }
    try {
      await this.queueService.leaveAllModes(userId);
    } catch (error) {
      this.logger.error(
        `could not remove user ${userId} from the queue: ${(error as Error).message}`,
      );
    }
  }

  @SubscribeMessage('queue.join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinQueueDto,
  ) {
    const userId = requireSocketUser(client);
    if (body?.mode !== QueueMode.RANKED && body?.mode !== QueueMode.UNRANKED) {
      throw new WsException(ErrorCode.INVALID_QUEUE_MODE);
    }
    if (await this.matchesService.findActiveForUser(userId)) {
      throw new WsException(ErrorCode.ALREADY_IN_MATCH);
    }

    const user = await this.usersService.findById(userId);
    await this.queueService.join(body.mode, {
      userId,
      socketId: client.id,
      rating: user.rating,
      joinedAt: Date.now(),
    });

    client.emit('queue.joined', { mode: body.mode });
  }

  @SubscribeMessage('queue.leave')
  async handleLeave(@ConnectedSocket() client: Socket) {
    const userId = requireSocketUser(client);
    await this.queueService.leaveAllModes(userId);
    client.emit('queue.left', {});
  }

  private async isConnected(socketId: string): Promise<boolean> {
    const sockets = await this.server.in(socketId).fetchSockets();
    return sockets.length > 0;
  }

  private async tick() {
    if (this.ticking) {
      return;
    }
    this.ticking = true;
    try {
      const matches = await this.matchmakingService.tick((socketId) =>
        this.isConnected(socketId),
      );
      for (const match of matches) {
        const [playerA, playerB] = match.players;
        this.server.to(playerA.socketId).emit('queue.matched', {
          matchId: match.matchId,
          mode: match.mode,
          opponentId: playerB.userId,
        });
        this.server.to(playerB.socketId).emit('queue.matched', {
          matchId: match.matchId,
          mode: match.mode,
          opponentId: playerA.userId,
        });
      }
    } catch (error) {
      this.logger.error(`matchmaking tick failed: ${(error as Error).message}`);
    } finally {
      this.ticking = false;
    }
  }
}
