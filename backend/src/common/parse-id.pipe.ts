import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Optional,
  ParseIntPipe,
  PipeTransform,
} from '@nestjs/common';
import { ErrorCode } from './error-codes.js';

export const MAX_INT_ID = 2_147_483_647;

@Injectable()
export class ParseIdPipe implements PipeTransform<
  string | undefined,
  Promise<number | undefined>
> {
  private readonly parseInt: ParseIntPipe;

  constructor(@Optional() options: { optional?: boolean } = {}) {
    this.parseInt = new ParseIntPipe({
      optional: options.optional,
      exceptionFactory: () => new BadRequestException(ErrorCode.INVALID_ID),
    });
  }

  async transform(
    value: string | undefined,
    metadata: ArgumentMetadata,
  ): Promise<number | undefined> {
    const id = await this.parseInt.transform(value as string, metadata);
    if (id === undefined || id === null) {
      return undefined;
    }
    if (id < 1 || id > MAX_INT_ID) {
      throw new BadRequestException(ErrorCode.INVALID_ID);
    }
    return id;
  }
}
