import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtRequestUser } from '../../common/middlewares/auth.middleware';
import { createBookingNo } from '../../utils/id.util';
import { Course } from '../course/entity/course.entity';
import { NotificationService } from '../notification/notification.service';
import { Booking } from './entity/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

const notificationTitleMap: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: '预约已提交',
  [BookingStatus.CONFIRMED]: '预约已确认',
  [BookingStatus.COMPLETED]: '预约已完成',
  [BookingStatus.CANCELLED]: '预约已取消',
  [BookingStatus.NO_SHOW]: '预约已缺席',
};

const notificationTypeMap: Record<BookingStatus, NotificationType> = {
  [BookingStatus.PENDING]: NotificationType.BOOKING_PENDING,
  [BookingStatus.CONFIRMED]: NotificationType.BOOKING_CONFIRMED,
  [BookingStatus.COMPLETED]: NotificationType.BOOKING_COMPLETED,
  [BookingStatus.CANCELLED]: NotificationType.BOOKING_CANCELLED,
  [BookingStatus.NO_SHOW]: NotificationType.BOOKING_NO_SHOW,
};

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateBookingDto, user: JwtRequestUser) {
    const course = await this.courseRepo.findOne({ where: { id: dto.courseId }, relations: ['workshop'] });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    const booked = await this.bookingRepo.sum('peopleCount', {
      courseId: dto.courseId,
      bookingDate: dto.bookingDate,
      timeSlot: dto.timeSlot,
      status: Not(BookingStatus.CANCELLED),
    });
    if ((booked ?? 0) + dto.peopleCount > course.maxParticipants) {
      throw new BadRequestException('该时段余位不足');
    }

    const booking = await this.bookingRepo.save(
      this.bookingRepo.create({
        ...dto,
        bookingNo: createBookingNo(),
        studentId: user.id,
        status: BookingStatus.PENDING,
      }),
    );

    await this.sendStatusNotification(booking, course.title);

    return booking;
  }

  findMy(userId: number, status?: BookingStatus) {
    return this.bookingRepo.find({
      where: { studentId: userId, ...(status ? { status } : {}) },
      relations: ['course', 'course.workshop', 'student', 'review'],
      order: { createdAt: 'DESC' },
    });
  }

  findInstructorBookings(userId: number) {
    return this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.course', 'course')
      .leftJoinAndSelect('course.workshop', 'workshop')
      .leftJoinAndSelect('booking.student', 'student')
      .where('course.instructorId = :userId', { userId })
      .orderBy('booking.createdAt', 'DESC')
      .getMany();
  }

  async updateStatus(id: number, status: BookingStatus, user: JwtRequestUser) {
    const booking = await this.bookingRepo.findOne({ where: { id }, relations: ['course'] });
    if (!booking) {
      throw new NotFoundException('预约不存在');
    }
    const ownsBooking = booking.studentId === user.id;
    const ownsCourse = booking.course.instructorId === user.id;
    if (user.role !== UserRole.ADMIN && !ownsBooking && !ownsCourse) {
      throw new ForbiddenException('无权修改该预约');
    }
    if (ownsBooking && status !== BookingStatus.CANCELLED && user.role === UserRole.STUDENT) {
      throw new ForbiddenException('学员仅可取消自己的预约');
    }
    const oldStatus = booking.status;
    booking.status = status;
    const saved = await this.bookingRepo.save(booking);
    if (oldStatus !== status) {
      await this.sendStatusNotification(saved, booking.course.title);
    }
    return saved;
  }

  async checkIn(id: number, user: JwtRequestUser) {
    const booking = await this.bookingRepo.findOne({ where: { id }, relations: ['course'] });
    if (!booking) {
      throw new NotFoundException('预约不存在');
    }
    if (user.role !== UserRole.ADMIN && booking.course.instructorId !== user.id) {
      throw new ForbiddenException('只有课程导师可签到');
    }
    const oldStatus = booking.status;
    booking.status = BookingStatus.COMPLETED;
    const saved = await this.bookingRepo.save(booking);
    if (oldStatus !== BookingStatus.COMPLETED) {
      await this.sendStatusNotification(saved, booking.course.title);
    }
    return saved;
  }

  private async sendStatusNotification(booking: Booking, courseTitle: string) {
    const title = notificationTitleMap[booking.status];
    const content = `您的「${courseTitle}」预约状态已更新为${title}，预约编号：${booking.bookingNo}`;
    const type = notificationTypeMap[booking.status];
    await this.notificationService.create(
      booking.studentId,
      type,
      title,
      content,
      booking.id,
    );
  }
}

