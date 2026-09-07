import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AuthenticatedRequest,
  JwtPayload,
} from './types/jwt-payload.interface';
import { ErrorCode } from '../common/error-codes';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;

    if (!header) {
      throw new UnauthorizedException(ErrorCode.INVALID_TOKEN);
    }
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(ErrorCode.INVALID_TOKEN);
    }
    try {
      const payload = this.jwtService.verify<JwtPayload>(parts[1]);
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException(ErrorCode.INVALID_TOKEN);
    }
  }
}
