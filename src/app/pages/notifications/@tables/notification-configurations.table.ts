import { TableColumn } from '@shared/@modules/master-data/@types/list';
import { NotificationConfiguration } from '../@types/notification';

export const NotificationConfigurationsTable: TableColumn<NotificationConfiguration>[] = [
  {
    title: 'Departamento',
    name: 'departmentName',
    altName: 'departmentId',
  },
  {
    title: 'Canal',
    name: 'formattedChannel',
    altName: 'channel',
    render: 'tag',
  },
  {
    title: 'Evento',
    name: 'formattedEvent',
    altName: 'event',
    render: 'tag',
  },
  {
    title: 'Rol destinatario',
    name: 'recipientRoleName',
    altName: 'recipientRoleId',
  },
  {
    title: 'Template',
    name: 'mailTemplateName',
    altName: 'mailTemplateId',
  },
  {
    title: 'Estado',
    name: 'formattedStatus',
    altName: 'active',
    render: 'tag',
  },
];
