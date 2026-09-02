import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {

  constructor(private jwtService: JwtService) { }

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const header = req.headers.authorization;

    if (!header) {
      throw new UnauthorizedException("Invalid authentication token");
    }
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new UnauthorizedException("Invalid authentication token");
    }
    try {
      const payload = this.jwtService.verify(parts[1]);
      req.user = payload;
      return true;
    } catch (e) {
      throw new UnauthorizedException("Invalid authentication token");
    }
  }
}