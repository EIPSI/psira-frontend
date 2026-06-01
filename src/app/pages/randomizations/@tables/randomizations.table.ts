import { TableColumn } from '@shared/@modules/master-data/@types/list';
import { RandomizationRule } from '../@types/randomization';

export const RandomizationsTable: TableColumn<RandomizationRule>[] = [
  {
    title: 'Name',
    name: 'name',
    translationPath: 'randomizations.name',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'Type',
    name: 'formattedType',
    altName: 'type',
    translationPath: 'randomizations.type',
    render: 'tag',
  },
  {
    title: 'Department',
    name: 'departmentNames',
    translationPath: 'randomizations.department',
  },
  {
    title: 'Items',
    name: 'itemCount',
    translationPath: 'randomizations.itemCount',
  },
  {
    title: 'Status',
    name: 'formattedStatus',
    altName: 'active',
    translationPath: 'randomizations.status',
    render: 'tag',
  },
  {
    title: 'Created At',
    name: 'createdAt',
    translationPath: 'randomizations.createdAt',
    render: 'date',
    sort: true,
  },
  {
    title: 'Updated At',
    name: 'updatedAt',
    translationPath: 'randomizations.updatedAt',
    render: 'date',
    sort: true,
  },
];
