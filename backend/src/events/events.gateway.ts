import { HttpException, Logger } from '@nestjs/common';
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
} from '@nestjs/websockets';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/types/jwt-payload.interface.js';
import { FriendshipsService } from '../friendships/friendships.service.js';
import { FriendshipStatus } from '../generated/prisma/client.js';
import { MessageDto } from '../messages/dto/message.dto.js';
import { MessagesService } from '../messages/messages.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private onlineUsers: Map<number, Set<string>> = new Map();
  private readonly logger = new Logger(EventsGateway.name);
  @WebSocketServer()
  server: Server;

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

  constructor(
    private jwt: JwtService,
    private friends: FriendshipsService,
    private messages: MessagesService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
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

    const exists = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn('connection rejected: unknown user');
      client.disconnect();
    }
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

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ) {
    const dto = plainToInstance(SendMessageDto, raw);
    const errors = await validate(dto);
    if (errors.length) {
      return {
        ok: false,
        error: Object.values(errors[0].constraints ?? {})[0],
      };
    }
    let message: MessageDto;
    try {
      message = await this.messages.sendMessage(
        client.data.userId,
        dto.conversationId,
        dto.content,
      );
      const members = await this.messages.getConversationMembers(
        dto.conversationId,
      );
      for (const member of members) {
        this.server.to(`user:${member}`).emit('newMessage', message);
      }
    } catch (e) {
      if (e instanceof HttpException) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
    return { ok: true, message };
  }

  @OnEvent('user.deleted')
  handleUserDeleted(userId: number) {
    this.server.in(`user:${userId}`).disconnectSockets(true);
  }
}
