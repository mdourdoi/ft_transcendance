import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
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

  @Post('send')
  public sendRequest(@CurrentUser('sub') userId: number) {
    void userId;
  }

  @Post('cancel')
  public cancelRequest(@CurrentUser('sub') userId: number) {
    void userId;
  }

  @Post('accept')
  public acceptRequest(@CurrentUser('sub') userId: number) {
    void userId;
  }

  @Post('deny')
  public denyRequest(@CurrentUser('sub') userId: number) {
    void userId;
  }

  @Post('remove')
  public removeFriend(@CurrentUser('sub') userId: number) {
    void userId;
  }

  @Post('block')
  public blockUser(@CurrentUser('sub') userId: number) {
    void userId;
  }

  @Post('unblock')
  public unblockUser(@CurrentUser('sub') userId: number) {
    void userId;
  }
}
