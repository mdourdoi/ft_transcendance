import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from '../auth/types/jwt-payload.interface.js';
import { ErrorCode } from './error-codes.js';

export function authenticateSocket(
  jwtService: JwtService,
  client: Socket,
): number {
  const payload = jwtService.verify<JwtPayload>(extractSocketToken(client));
  client.data.userId = payload.sub;
  if (payload.exp) {
    client.data.expiryTimer = setTimeout(
      () => {
        client.emit('auth.expired');
        client.disconnect(true);
      },
      payload.exp * 1000 - Date.now(),
    );
  }
  return payload.sub;
}

export function releaseSocket(client: Socket): void {
  clearTimeout(client.data.expiryTimer as NodeJS.Timeout | undefined);
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
