import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { FriendshipDto } from './dto/friendship.dto';
import { FriendshipsService } from './friendships.service';

@Controller('friendships')
@UseGuards(JwtGuard)
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Get('')
  public getFriendships(
    @Query('status') statusQuery: string,
    @CurrentUser('sub') userId: number,
  ): Promise<FriendshipDto[]> {
    const statusList: FriendshipStatus[] = statusQuery
      .split(',')
      .filter((s) => s in FriendshipStatus)
      .map((s) => FriendshipStatus[s]);

    return this.friendshipsService.getFriendships(userId, statusList);
  }

  // Add friend

  // Remove friend

  // Block user

  // Cancel pending
}
