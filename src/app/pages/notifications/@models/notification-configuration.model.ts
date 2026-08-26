import {
  NotificationChannelLabel,
  NotificationConfiguration,
  NotificationEventLabel,
  NotificationFamilyLabel,
} from '../@types/notification';

export class NotificationConfigurationModel {
  static fromJson(configuration: NotificationConfiguration): NotificationConfiguration {
    return {
      ...configuration,
      departmentName: configuration.department?.name || 'Default',
      channelLabel: NotificationChannelLabel[configuration.channel] || configuration.channel,
      familyLabel: NotificationFamilyLabel[configuration.family] || configuration.family,
      eventLabel: NotificationEventLabel[configuration.event] || configuration.event,
      formattedChannel: {
        title: NotificationChannelLabel[configuration.channel] || configuration.channel,
        color: 'blue',
      },
      formattedEvent: {
        title: NotificationEventLabel[configuration.event] || configuration.event,
        color: 'purple',
      },
      recipientRoleName: configuration.recipientRole?.name || String(configuration.recipientRoleId),
      mailTemplateName: configuration.mailTemplate?.name || '-',
      formattedStatus: {
        title: configuration.active ? 'Activa' : 'Inactiva',
        color: configuration.active ? 'green' : 'default',
      },
    } as NotificationConfiguration;
  }
}
