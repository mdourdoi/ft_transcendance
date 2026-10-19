import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from '../auth/types/jwt-payload.interface.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ErrorCode } from './error-codes.js';

const expiryTimers = new Map<
  string,
  { client: Socket; timer: NodeJS.Timeout }
>();

export async function authenticateSocket(
  jwtService: JwtService,
  prisma: PrismaService,
  client: Socket,
): Promise<number> {
  const payload = jwtService.verify<JwtPayload>(extractSocketToken(client));
  client.data.userId = payload.sub;
  const exists = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true },
  });
  if (!exists) {
    client.data.userId = undefined;
    throw new WsException(ErrorCode.INVALID_TOKEN);
  }
  if (payload.exp && client.connected) {
    armExpiry(client, payload.exp);
  }
  return payload.sub;
}

export function extendUserSockets(
  userId: number,
  fromExp: number,
  toExp: number,
): void {
  for (const { client } of expiryTimers.values()) {
    if (client.data.userId === userId && client.data.exp === fromExp) {
      armExpiry(client, toExp);
    }
  }
}

export function releaseSocket(client: Socket): void {
  clearTimeout(expiryTimers.get(client.id)?.timer);
  expiryTimers.delete(client.id);
}

function armExpiry(client: Socket, exp: number): void {
  clearTimeout(expiryTimers.get(client.id)?.timer);
  client.data.exp = exp;
  const timer = setTimeout(
    () => {
      expiryTimers.delete(client.id);
      client.emit('auth.expired');
      client.disconnect(true);
    },
    exp * 1000 - Date.now(),
  );
  expiryTimers.set(client.id, { client, timer });
}

export function requireSocketUser(client: Socket): number {
  const userId = client.data.userId as number | undefined;
  if (userId === undefined) {
    throw new WsException(ErrorCode.INVALID_TOKEN);
  }
  return userId;
}

function extractSocketToken(client: Socket): string {
  const authToken = client.handshake.auth?.token as string | undefined;
  if (authToken) {
    return authToken;
  }
  const bearerToken = client.handshake.headers.authorization?.split(' ')[1];
  if (!bearerToken) {
    throw new WsException(ErrorCode.INVALID_TOKEN);
  }
  return bearerToken;
}
