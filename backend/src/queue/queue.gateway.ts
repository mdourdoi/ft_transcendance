import {
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
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
import { QueueMode } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/types/jwt-payload.interface';
import { ErrorCode } from '../common/error-codes';
import { UsersService } from '../users/users.service';
import { JoinQueueDto } from './dto/join-queue.dto';
import { MatchmakingService } from './matchmaking.service';
import { QueueService } from './queue.service';

const MATCHMAKING_TICK_MS = 1500;

@WebSocketGateway({ namespace: '/queue', cors: { origin: '*' } })
export class QueueGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly socketUserIds = new Map<string, number>();
  private tickInterval?: NodeJS.Timeout;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
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

  handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify<JwtPayload>(token);
      this.socketUserIds.set(client.id, payload.sub);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.socketUserIds.get(client.id);
    this.socketUserIds.delete(client.id);
    if (userId !== undefined) {
      await this.queueService.leaveAllModes(userId);
    }
  }

  @SubscribeMessage('queue.join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinQueueDto,
  ) {
    const userId = this.requireUserId(client);
    if (body?.mode !== QueueMode.RANKED && body?.mode !== QueueMode.UNRANKED) {
      throw new WsException(ErrorCode.INVALID_QUEUE_MODE);
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
    const userId = this.requireUserId(client);
    await this.queueService.leaveAllModes(userId);
    client.emit('queue.left', {});
  }

  private async tick() {
    const matches = await this.matchmakingService.tick();
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
  }

  private extractToken(client: Socket): string {
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) {
      return authToken;
    }
    const header = client.handshake.headers.authorization;
    const bearerToken = header?.split(' ')[1];
    if (!bearerToken) {
      throw new UnauthorizedException(ErrorCode.INVALID_TOKEN);
    }
    return bearerToken;
  }

  private requireUserId(client: Socket): number {
    const userId = this.socketUserIds.get(client.id);
    if (userId === undefined) {
      throw new WsException(ErrorCode.INVALID_TOKEN);
    }
    return userId;
  }
}
