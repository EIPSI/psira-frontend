import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';

export const QuestionnaireBundlesColumns: TableColumn<any>[] = [
  {
    title: 'Name',
    name: 'name',
    translationPath: 'emailTemplates.name',
    filterField: {
      type: 'text',
      value: '',
    },
  },
  {
    title: 'Estado',
    name: 'activeStatus',
    render: 'tag',
    filterField: {
      type: 'select',
      value: '',
      options: [
        { value: true, label: 'Activa' },
        { value: false, label: 'Inactiva' },
      ],
    },
    altName: 'active',
  },
  {
    title: 'Structure',
    name: 'summary',
    filterField: {
      type: 'text',
      value: '',
    },
  },
  {
    title: 'Departments',
    name: 'departmentNames',
    filterField: {
      type: 'text',
      value: '',
    },
  },
  {
    title: 'Fecha de creación',
    name: 'createdAt',
    render: 'date',
    sort: true,
    filterField: {
      type: 'date',
      value: '',
    },
  },
  {
    title: 'Última actualización',
    name: 'updatedAt',
    render: 'date',
    sort: true,
    filterField: {
      type: 'date',
      value: '',
    },
  },
];
