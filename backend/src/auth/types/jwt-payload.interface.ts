import { Request } from 'express';

export interface JwtPayload {
  sub: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
