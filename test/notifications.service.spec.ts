import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsService } from '../src/notifications/notifications.service';
import { NotificationLog } from '../src/notifications/schemas/notification-log.schema';
import { PreferencesService } from '../src/preferences/preferences.service';
import { BadRequestException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let model: Model<NotificationLog>;
  let preferencesService: PreferencesService;

  const mockNotification = {
    userId: 'test123',
    type: 'marketing',
    channel: 'email',
    content: { subject: 'Test Email', body: 'Test Content' },
    status: 'sent',
    sentAt: new Date(),
    metadata: { content: { subject: 'Test Email', body: 'Test Content' } },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(NotificationLog.name),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            countDocuments: jest.fn(),
          },
        },
        {
          provide: PreferencesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    model = module.get<Model<NotificationLog>>(getModelToken(NotificationLog.name));
    preferencesService = module.get<PreferencesService>(PreferencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send a notification successfully', async () => {
    jest.spyOn(preferencesService, 'findOne').mockResolvedValueOnce({
      preferences: { channels: { email: true } },
    } as any);

    jest.spyOn(model, 'create').mockResolvedValueOnce(mockNotification as any);

    const result = await service.send({
      userId: 'test123',
      type: 'marketing',
      channel: 'email',
      content: { subject: 'Test Email', body: 'Test Content' },
    });
    expect(result.status).toEqual('sent');
  });

  it('should throw an error if channel is disabled', async () => {
    jest.spyOn(preferencesService, 'findOne').mockResolvedValueOnce({
      preferences: { channels: { email: false } },
    } as any);

    await expect(
      service.send({
        userId: 'test123',
        type: 'marketing',
        channel: 'email',
        content: { subject: 'Test Email', body: 'Test Content' },
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
