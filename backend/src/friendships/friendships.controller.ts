import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { AcceptRequestDto } from './dto/accept-request.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { DenyRequestDto } from './dto/deny-request.dto';
import { FriendRequestDto } from './dto/friend-request.dto';
import { FriendshipDto } from './dto/friendship.dto';
import { RemoveFriendDto } from './dto/remove-friend.dto';
import { UnblockUserDto } from './dto/unblock-user.dto';
import { FriendshipsService } from './friendships.service';

@Controller('friendships')
@UseGuards(JwtGuard)
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  /**
   * Get the list of accepted friendships, so the friends, of the logged in user.
   *
   * @returns A list with all the friendships.
   * @example GET localhost:5173/friendships
   */
  @Get('')
  @HttpCode(HttpStatus.OK)
  public getFriendships(
    @CurrentUser('sub') userId: number,
  ): Promise<FriendshipDto[]> {
    return this.friendshipsService.getFriendships(userId, [
      FriendshipStatus.ACCEPTED,
    ]);
  }

  /**
   * Get the list of the friendship requests the logged in user has sent but has not been accepted by the targets yet.
   *
   * @returns A list with all the friendships pending requests.
   * @example GET localhost:5173/friendships/pending
   */
  @Get('pending')
  @HttpCode(HttpStatus.OK)
  public async getPending(
    @CurrentUser('sub') userId: number,
  ): Promise<FriendshipDto[]> {
    const friendships = await this.friendshipsService.getFriendships(userId, [
      FriendshipStatus.PENDING,
    ]);

    return friendships.filter((f) => f.isSender);
  }

  /**
   * Get the list of the friendship requests the logged in user has received but has not accepted yet.
   *
   * @returns A list with all the friendships received requests.
   * @example GET localhost:5173/friendships/requests
   */
  @Get('requests')
  @HttpCode(HttpStatus.OK)
  public async getRequests(
    @CurrentUser('sub') userId: number,
  ): Promise<FriendshipDto[]> {
    const friendships = await this.friendshipsService.getFriendships(userId, [
      FriendshipStatus.PENDING,
    ]);

    return friendships.filter((f) => !f.isSender);
  }

  /**
   * Get the list of the users the logged in user has blocked.
   *
   * @returns A list with all the blocked users.
   * @example GET localhost:5173/friendships/blocked
   */
  @Get('blocked')
  @HttpCode(HttpStatus.OK)
  public async getBlocked(
    @CurrentUser('sub') userId: number,
  ): Promise<FriendshipDto[]> {
    const friendships = await this.friendshipsService.getFriendships(userId, [
      FriendshipStatus.BLOCKED,
    ]);

    return friendships.filter((f) => f.isSender);
  }

  /**
   * Send a friend request to a user. The two users must not have any current friendship (ACCEPTED/BLOCKED) between them.
   *
   * @param dto The object containing the target of the request.
   * @example POST localhost:5173/friendships/send {...}
   */
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  public sendRequest(
    @CurrentUser('sub') userId: number,
    @Body() dto: FriendRequestDto,
  ) {
    return this.friendshipsService.sendRequest(userId, dto);
  }

  /**
   * Cancel a pending friend request the user sent but has not been accepted yet.
   *
   * @param dto The object containing the target of the request.
   * @example POST localhost:5173/friendships/cancel {...}
   */
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  public cancelRequest(
    @CurrentUser('sub') userId: number,
    @Body() dto: FriendRequestDto,
  ) {
    return this.friendshipsService.sendRequest(userId, dto);
  }

  /**
   * Accept a friend request the user received. Once it is accepted, the two users are friends.
   *
   * @param dto The object containing the target of the request.
   * @example POST localhost:5173/friendships/accept {...}
   */
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  public acceptRequest(
    @CurrentUser('sub') userId: number,
    @Body() dto: AcceptRequestDto,
  ) {
    return this.friendshipsService.acceptRequest(userId, dto);
  }

  /**
   * Deny a friend request the user received.
   *
   * @param dto The object containing the target of the request.
   * @example POST localhost:5173/friendships/deny {...}
   */
  @Post('deny')
  @HttpCode(HttpStatus.OK)
  public denyRequest(
    @CurrentUser('sub') userId: number,
    @Body() dto: DenyRequestDto,
  ) {
    return this.friendshipsService.denyRequest(userId, dto);
  }

  /**
   * Remove a friend from the logged in user friends list.
   *
   * @param dto The object containing the target of the request.
   * @example POST localhost:5173/friendships/remove {...}
   */
  @Post('remove')
  @HttpCode(HttpStatus.OK)
  public removeFriend(
    @CurrentUser('sub') userId: number,
    @Body() dto: RemoveFriendDto,
  ) {
    return this.friendshipsService.removeFriend(userId, dto);
  }

  /**
   * Block a user from the logged in user. The target can be a friend, or not.
   *
   * @param dto The object containing the target of the request.
   * @example POST localhost:5173/friendships/block {...}
   */
  @Post('block')
  @HttpCode(HttpStatus.CREATED)
  public blockUser(
    @CurrentUser('sub') userId: number,
    @Body() dto: BlockUserDto,
  ) {
    return this.friendshipsService.blockUser(userId, dto);
  }

  /**
   * Unblock a user the logged in user may have blocked. The target must has been blocked.
   *
   * @param dto The object containing the target of the request.
   * @example POST localhost:5173/friendships/unblock {...}
   */
  @Post('unblock')
  @HttpCode(HttpStatus.OK)
  public unblockUser(
    @CurrentUser('sub') userId: number,
    @Body() dto: UnblockUserDto,
  ) {
    return this.friendshipsService.unblockUser(userId, dto);
  }
}
