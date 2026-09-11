import { TableColumn } from '@shared/@modules/master-data/@types/list';
import { RandomizationRule } from '../@types/randomization';

export const RandomizationsTable: TableColumn<RandomizationRule>[] = [
  {
    title: 'randomizations.name',
    name: 'name',
    translationPath: 'randomizations.name',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'randomizations.type',
    name: 'formattedType',
    altName: 'type',
    translationPath: 'randomizations.type',
    render: 'tag',
    sort: true,
  },
  {
    title: 'randomizations.department',
    name: 'departmentNames',
    translationPath: 'randomizations.department',
    sort: true,
  },
  {
    title: 'randomizations.itemCount',
    name: 'itemCount',
    translationPath: 'randomizations.itemCount',
    sort: true,
  },
  {
    title: 'randomizations.status',
    name: 'formattedStatus',
    altName: 'active',
    translationPath: 'randomizations.status',
    render: 'tag',
    sort: true,
  },
  {
    title: 'randomizations.createdAt',
    name: 'createdAt',
    translationPath: 'randomizations.createdAt',
    render: 'date',
    sort: true,
  },
  {
    title: 'randomizations.updatedAt',
    name: 'updatedAt',
    translationPath: 'randomizations.updatedAt',
    render: 'date',
    sort: true,
  },
];
