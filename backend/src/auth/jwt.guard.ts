import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from '../common/error-codes.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AuthenticatedRequest,
  JwtPayload,
} from './types/jwt-payload.interface.js';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;

    if (!header) {
      throw new UnauthorizedException(ErrorCode.INVALID_TOKEN);
    }
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(ErrorCode.INVALID_TOKEN);
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(parts[1]);
    } catch {
      throw new UnauthorizedException(ErrorCode.INVALID_TOKEN);
    }
    const exists = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
      },
    });
    if (!exists) throw new UnauthorizedException(ErrorCode.INVALID_TOKEN);
    req.user = payload;
    return true;
  }
}
