import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';

export const EmailTemplatesColumns: TableColumn<any>[] = [
  {
    title: 'Name',
    name: 'name',
    translationPath: 'emailTemplates.name',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'Subject',
    name: 'subject',
    translationPath: 'emailTemplates.subject',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'Emisor',
    name: 'senderName',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'Status',
    name: 'formattedStatus',
    render: 'tag',
    translationPath: 'emailTemplates.status',
    sort: true,
  },
  {
    title: 'Departments',
    name: 'departmentNames',
    sort: true,
  },
];
