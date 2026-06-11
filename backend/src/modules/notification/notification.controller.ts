import { Controller, Get, Param, Patch, Post, Body, Req, UseGuards } from '@nestjs/common';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/guard/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationService } from './notification.service';
import { MarkAsReadDto } from './dto/mark-as-read.dto';

@Controller('notifications')
@UseGuards(RoleGuard)
@Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findMy(@Req() req: any) {
    return this.notificationService.findMy(req.user.id);
  }

  @Get('unread-count')
  countUnread(@Req() req: any) {
    return this.notificationService.countUnread(req.user.id).then((count) => ({ count }));
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Body() dto: MarkAsReadDto, @Req() req: any) {
    return this.notificationService.markAsRead(Number(id), req.user.id, dto.isRead);
  }

  @Post('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }
}
