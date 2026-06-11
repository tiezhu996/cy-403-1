import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { Booking } from '../booking/entity/booking.entity';
import { Notification } from './entity/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
  ) {}

  async create(
    userId: number,
    type: NotificationType,
    title: string,
    content: string,
    bookingId?: number,
  ) {
    return this.notificationRepo.save(
      this.notificationRepo.create({
        userId,
        type,
        title,
        content,
        bookingId,
        isRead: false,
      }),
    );
  }

  findMy(userId: number) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  countUnread(userId: number) {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: number, userId: number, isRead: boolean) {
    const notification = await this.notificationRepo.findOne({ where: { id, userId } });
    if (!notification) {
      throw new NotFoundException('通知不存在');
    }
    notification.isRead = isRead;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  async getBookingFromNotification(id: number, userId: number) {
    const notification = await this.notificationRepo.findOne({ where: { id, userId } });
    if (!notification) {
      throw new NotFoundException('通知不存在');
    }
    if (!notification.bookingId) {
      return null;
    }
    return this.bookingRepo.findOne({
      where: { id: notification.bookingId },
      relations: ['course', 'course.workshop'],
    });
  }
}
