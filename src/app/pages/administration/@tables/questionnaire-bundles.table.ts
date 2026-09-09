import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';

export const QuestionnaireBundlesColumns: TableColumn<any>[] = [
  {
    title: 'core.name',
    name: 'name',
    translationPath: 'core.name',
    sort: true,
    filterField: {
      type: 'text',
      value: '',
    },
  },
  {
    title: 'core.status',
    name: 'activeStatus',
    translationPath: 'core.status',
    render: 'tag',
    sort: true,
    filterField: {
      type: 'select',
      value: '',
      options: [
        { value: true, label: 'core.active' },
        { value: false, label: 'core.inactive' },
      ],
    },
    altName: 'active',
  },
  {
    title: 'questionnaireBundles.structure',
    name: 'summary',
    translationPath: 'questionnaireBundles.structure',
    sort: true,
    filterField: {
      type: 'text',
      value: '',
    },
  },
  {
    title: 'core.departments',
    name: 'departmentNames',
    translationPath: 'core.departments',
    sort: true,
    filterField: {
      type: 'text',
      value: '',
    },
  },
  {
    title: 'questionnaireBundles.createdAt',
    name: 'createdAt',
    translationPath: 'questionnaireBundles.createdAt',
    render: 'date',
    sort: true,
    filterField: {
      type: 'date',
      value: '',
    },
  },
  {
    title: 'questionnaireBundles.updatedAt',
    name: 'updatedAt',
    translationPath: 'questionnaireBundles.updatedAt',
    render: 'date',
    sort: true,
    filterField: {
      type: 'date',
      value: '',
    },
  },
];
