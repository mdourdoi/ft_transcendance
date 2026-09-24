import { JwtService } from '@nestjs/jwt';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { JwtPayload } from '../auth/types/jwt-payload.interface.js';
import { FriendshipsService } from '../friendships/friendships.service.js';
import { FriendshipStatus } from '../generated/prisma/client.js';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private onlineUsers: Map<number, Set<string>> = new Map();
  private readonly logger = new Logger(EventsGateway.name);

  private async notifyPresence(userId: number, onlineStatus: boolean) {
    const friendList = await this.friends.getFriendships(userId, [
      FriendshipStatus.ACCEPTED,
    ]);
    for (const friendship of friendList) {
      this.server
        .to(`user:${friendship.user.id}`)
        .emit('presence', { userId, onlineStatus });
    }
  }

  @WebSocketServer()
  server: Server;
  constructor(
    private jwt: JwtService,
    private friends: FriendshipsService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      this.logger.warn('connection rejected: missing token');
      client.disconnect();
      return;
    }
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify(token);
    } catch {
      this.logger.warn('connection rejected: invalid token');
      client.disconnect();
      return;
    }
    client.data.userId = payload.sub;
    client.join(`user:${payload.sub}`);
    const sockets = this.onlineUsers.get(payload.sub);
    if (!sockets) {
      this.onlineUsers.set(payload.sub, new Set([client.id]));
      void this.notifyPresence(payload.sub, true);
    } else {
      sockets.add(client.id);
    }
    this.logger.log(`user ${payload.sub} connected (${client.id})`);
  }

  handleDisconnect(client: Socket) {
    const sockets = this.onlineUsers.get(client.data.userId);
    if (!sockets) {
      return;
    }
    sockets.delete(client.id);
    if (sockets.size === 0) {
      this.onlineUsers.delete(client.data.userId);
      void this.notifyPresence(client.data.userId, false);
    }
    this.logger.log(`user ${client.data.userId} disconnected (${client.id})`);
  }

  @SubscribeMessage('getOnlineFriends')
  async handleGetOnlineFriends(@ConnectedSocket() client: Socket) {
    const friendList = await this.friends.getFriendships(client.data.userId, [
      FriendshipStatus.ACCEPTED,
    ]);
    const statuses: { userId: number; onlineStatus: boolean }[] = [];
    for (const friendship of friendList) {
      statuses.push({
        userId: friendship.user.id,
        onlineStatus: this.onlineUsers.has(friendship.user.id),
      });
    }
    return statuses;
  }
}
