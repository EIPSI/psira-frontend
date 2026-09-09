import { TableColumn } from '@shared/@modules/master-data/@types/list';
import { NotificationConfiguration } from '../@types/notification';

export const NotificationConfigurationsTable: TableColumn<NotificationConfiguration>[] = [
  {
    title: 'notifications.department',
    translationPath: 'notifications.department',
    name: 'departmentName',
    altName: 'departmentId',
    sort: true,
  },
  {
    title: 'notifications.channel',
    translationPath: 'notifications.channel',
    name: 'formattedChannel',
    altName: 'channel',
    render: 'tag',
    sort: true,
  },
  {
    title: 'notifications.event',
    translationPath: 'notifications.event',
    name: 'formattedEvent',
    altName: 'event',
    render: 'tag',
    sort: true,
  },
  {
    title: 'notifications.recipientRole',
    translationPath: 'notifications.recipientRole',
    name: 'recipientRoleName',
    altName: 'recipientRoleId',
    sort: true,
  },
  {
    title: 'notifications.template',
    translationPath: 'notifications.template',
    name: 'mailTemplateName',
    altName: 'mailTemplateId',
    sort: true,
  },
  {
    title: 'core.status',
    translationPath: 'core.status',
    name: 'formattedStatus',
    altName: 'active',
    render: 'tag',
    sort: true,
  },
];
