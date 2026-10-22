import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../generated/prisma/client.js';

type PrismaError =
  Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError;

const BAD_REQUEST_CODES = new Set([
  'P2000',
  'P2005',
  'P2006',
  'P2007',
  'P2020',
]);
const CONFLICT_CODES = new Set(['P2002', 'P2003', 'P2034']);

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: PrismaError, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      throw exception;
    }
    super.catch(this.toHttpException(exception) ?? exception, host);
  }

  private toHttpException(exception: PrismaError): HttpException | null {
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return new BadRequestException();
    }
    if (BAD_REQUEST_CODES.has(exception.code)) {
      return new BadRequestException();
    }
    if (CONFLICT_CODES.has(exception.code)) {
      return new ConflictException();
    }
    if (exception.code === 'P2025') {
      return new NotFoundException();
    }
    return null;
  }
}
