import { Request } from 'express';

export interface JwtPayload {
  sub: number;
  username: string;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
