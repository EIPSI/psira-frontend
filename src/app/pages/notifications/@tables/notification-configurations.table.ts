import { TableColumn } from '@shared/@modules/master-data/@types/list';
import { NotificationConfiguration } from '../@types/notification';

export const NotificationConfigurationsTable: TableColumn<NotificationConfiguration>[] = [
  {
    title: 'Departamento',
    name: 'departmentName',
    altName: 'departmentId',
    sort: true,
  },
  {
    title: 'Canal',
    name: 'formattedChannel',
    altName: 'channel',
    render: 'tag',
    sort: true,
  },
  {
    title: 'Evento',
    name: 'formattedEvent',
    altName: 'event',
    render: 'tag',
    sort: true,
  },
  {
    title: 'Rol destinatario',
    name: 'recipientRoleName',
    altName: 'recipientRoleId',
    sort: true,
  },
  {
    title: 'Template',
    name: 'mailTemplateName',
    altName: 'mailTemplateId',
    sort: true,
  },
  {
    title: 'Estado',
    name: 'formattedStatus',
    altName: 'active',
    render: 'tag',
    sort: true,
  },
];
