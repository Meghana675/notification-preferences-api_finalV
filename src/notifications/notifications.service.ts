import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationLog } from './schemas/notification-log.schema';
import { SendNotificationDto } from './dto/send-notification.dto';
import { PreferencesService } from '../preferences/preferences.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(NotificationLog.name) private notificationLogModel: Model<NotificationLog>,
    private preferencesService: PreferencesService,
  ) {}

  async send(sendNotificationDto: SendNotificationDto): Promise<NotificationLog> {
    const preferences = await this.preferencesService.findOne(sendNotificationDto.userId);
    
    if (!preferences.preferences.channels[sendNotificationDto.channel]) {
      throw new BadRequestException(`User has disabled ${sendNotificationDto.channel} notifications`);
    }

    // Simulate notification sending
    const success = Math.random() > 0.1; // 90% success rate

    const log = new this.notificationLogModel({
      ...sendNotificationDto,
      status: success ? 'sent' : 'failed',
      sentAt: success ? new Date() : undefined,
      failureReason: success ? undefined : 'Delivery failed',
      metadata: { content: sendNotificationDto.content },
    });

    return log.save();
  }

  async getLogs(userId: string): Promise<NotificationLog[]> {
    return this.notificationLogModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getStats() {
    const [total, sent, failed] = await Promise.all([
      this.notificationLogModel.countDocuments(),
      this.notificationLogModel.countDocuments({ status: 'sent' }),
      this.notificationLogModel.countDocuments({ status: 'failed' }),
    ]);

    return {
      total,
      sent,
      failed,
      successRate: total > 0 ? (sent / total) * 100 : 0,
    };
  }
}
