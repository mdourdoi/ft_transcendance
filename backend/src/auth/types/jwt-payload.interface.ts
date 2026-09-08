import { Request } from 'express';

export interface JwtPayload {
  sub: number;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
