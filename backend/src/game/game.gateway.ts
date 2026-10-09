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
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Server, Socket } from 'socket.io';
import { resolveCorsOrigin } from '../common/cors.js';
import { ErrorCode } from '../common/error-codes.js';
import {
  authenticateSocket,
  releaseSocket,
  requireSocketUser,
} from '../common/socket-auth.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  GameActionDto,
  PassTurnDto,
  PlayMoveDto,
} from './dto/game-action.dto.js';
import { DISCONNECT_FORFEIT_MS, GameService } from './game.service.js';
import { GameSession } from './types/game-session.interface.js';

const DEADLINE_TICK_MS = 1000;
const RETRY_EVERY_TICKS = 10;
const ORPHAN_SWEEP_EVERY_TICKS = 30;

@WebSocketGateway({ namespace: '/game', cors: { origin: resolveCorsOrigin } })
export class GameGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private tickInterval?: NodeJS.Timeout;
  private ticking = false;
  private tickCount = 0;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly gameService: GameService,
  ) {}

  onModuleInit() {
    this.tickInterval = setInterval(() => {
      void this.tick();
    }, DEADLINE_TICK_MS);
  }

  onModuleDestroy() {
    clearInterval(this.tickInterval);
  }

  async handleConnection(client: Socket) {
    try {
      const userId = await authenticateSocket(
        this.jwtService,
        this.prisma,
        client,
      );
      await client.join(`user:${userId}`);
    } catch {
      client.disconnect(true);
    }
  }

  @OnEvent('user.deleted')
  async handleUserDeleted(userId: number) {
    try {
      const ended = await this.gameService.abandonForUser(userId);
      for (const session of ended) {
        this.broadcast(session);
      }
    } catch (error) {
      this.logger.error(
        `could not abandon the games of deleted user ${userId}: ${(error as Error).message}`,
      );
    }
    this.server.in(`user:${userId}`).disconnectSockets(true);
  }

  async handleDisconnect(client: Socket) {
    releaseSocket(client);
    const userId = client.data.userId as number | undefined;
    const matchId = client.data.matchId as number | undefined;
    if (userId === undefined || matchId === undefined) {
      return;
    }
    try {
      const session = await this.gameService.markDisconnected(
        matchId,
        userId,
        () => this.isPresent(matchId, userId),
      );
      if (session?.status === 'PLAYING') {
        this.server.to(this.room(matchId)).emit('game.playerDisconnected', {
          userId,
          forfeitInMs: DISCONNECT_FORFEIT_MS,
        });
      }
    } catch (error) {
      this.logger.error(
        `disconnect handling failed for match ${matchId}: ${(error as Error).message}`,
      );
    }
  }

  @SubscribeMessage('game.join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ) {
    const userId = requireSocketUser(client);
    const dto = await this.parse(GameActionDto, raw);
    const { session, started } = await this.gameService.join(
      dto.matchId,
      userId,
      () => this.enterRoom(client, dto.matchId),
    );

    client.to(this.room(dto.matchId)).emit('game.playerJoined', { userId });
    if (started) {
      this.server
        .to(this.room(dto.matchId))
        .emit('game.state', this.gameService.toView(session));
    } else {
      client.emit('game.state', this.gameService.toView(session));
    }
    await this.answerAsBot(session);
  }

  @SubscribeMessage('game.move')
  async handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ) {
    const userId = requireSocketUser(client);
    const dto = await this.parse(PlayMoveDto, raw);
    const session = await this.gameService.play(
      dto.matchId,
      userId,
      dto.card,
      dto.from,
      dto.to,
    );
    this.broadcast(session, client);
    await this.answerAsBot(session);
  }

  @SubscribeMessage('game.pass')
  async handlePass(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ) {
    const userId = requireSocketUser(client);
    const dto = await this.parse(PassTurnDto, raw);
    const session = await this.gameService.pass(dto.matchId, userId, dto.card);
    this.broadcast(session, client);
    await this.answerAsBot(session);
  }

  @SubscribeMessage('game.resign')
  async handleResign(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ) {
    const userId = requireSocketUser(client);
    const dto = await this.parse(GameActionDto, raw);
    const session = await this.gameService.resign(dto.matchId, userId);
    this.broadcast(session, client);
  }

  private async tick() {
    if (this.ticking) {
      return;
    }
    this.ticking = true;
    this.tickCount++;
    try {
      const ended = await this.gameService.expireDue();
      for (const session of ended) {
        try {
          this.broadcast(session);
        } catch (error) {
          this.logger.error(
            `could not broadcast the end of match ${session.matchId}: ${(error as Error).message}`,
          );
        }
      }
      if (this.tickCount % RETRY_EVERY_TICKS === 0) {
        await this.gameService.retryUnrecorded();
      }
      if (this.tickCount % ORPHAN_SWEEP_EVERY_TICKS === 0) {
        await this.gameService.cancelOrphans();
      }
    } catch (error) {
      this.logger.error(`game tick failed: ${(error as Error).message}`);
    } finally {
      this.ticking = false;
    }
  }

  private broadcast(session: GameSession, client?: Socket) {
    const room = this.room(session.matchId);
    const target = client
      ? this.server.to(room).to(client.id)
      : this.server.to(room);
    target.emit('game.state', this.gameService.toView(session));
    if (session.status === 'OVER') {
      target.emit('game.over', {
        matchId: session.matchId,
        winnerId: session.winnerId,
        endReason: session.endReason,
      });
    }
  }

  private async answerAsBot(session: GameSession): Promise<void> {
    try {
      const answer = await this.gameService.playBotTurn(session);
      if (answer) {
        this.broadcast(answer);
      }
    } catch (error) {
      this.logger.error(
        `bot could not play in match ${session.matchId}: ${(error as Error).message}`,
      );
    }
  }

  private async enterRoom(client: Socket, matchId: number): Promise<void> {
    const previousMatchId = client.data.matchId as number | undefined;
    if (previousMatchId !== undefined && previousMatchId !== matchId) {
      await client.leave(this.room(previousMatchId));
    }
    client.data.matchId = matchId;
    await client.join(this.room(matchId));
  }

  private async isPresent(matchId: number, userId: number): Promise<boolean> {
    const sockets = await this.server.in(this.room(matchId)).fetchSockets();
    return sockets.some((socket) => socket.data.userId === userId);
  }

  private async parse<T extends object>(
    cls: new () => T,
    raw: unknown,
  ): Promise<T> {
    if (typeof raw !== 'object' || raw === null) {
      throw new WsException(ErrorCode.INVALID_GAME_PAYLOAD);
    }
    const dto = plainToInstance(cls, raw);
    if ((await validate(dto)).length > 0) {
      throw new WsException(ErrorCode.INVALID_GAME_PAYLOAD);
    }
    return dto;
  }

  private room(matchId: number): string {
    return `match:${matchId}`;
  }
}
