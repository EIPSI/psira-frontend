import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';

export const EmailTemplatesColumns: TableColumn<any>[] = [
  {
    title: 'emailTemplates.name',
    name: 'name',
    translationPath: 'emailTemplates.name',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'emailTemplates.subject',
    name: 'subject',
    translationPath: 'emailTemplates.subject',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'emailTemplates.senderName',
    translationPath: 'emailTemplates.senderName',
    name: 'senderName',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'emailTemplates.status',
    name: 'formattedStatus',
    render: 'tag',
    translationPath: 'emailTemplates.status',
    sort: true,
  },
  {
    title: 'departments.departments',
    translationPath: 'departments.departments',
    name: 'departmentNames',
    sort: true,
  },
];
