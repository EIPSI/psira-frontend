import { FormattedUser } from '@app/pages/user-management/@types/formatted-user';
import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';

export const CaseManagerColumns: TableColumn<FormattedUser>[] = [
  {
    title: 'tables.patients.firstName',
    name: 'firstName',
    translationPath: 'tables.casemanagers.firstName',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.patients.middleName',
    name: 'middleName',
    translationPath: 'tables.casemanagers.middleName',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.patients.lastName',
    name: 'lastName',
    translationPath: 'tables.casemanagers.lastName',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'forms.patients.id',
    name: 'workID',
    translationPath: 'tables.casemanagers.workID',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'forms.patients.phone',
    name: 'phone',
    translationPath: 'tables.casemanagers.phone',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.casemanagers.username',
    name: 'username',
    translationPath: 'tables.casemanagers.username',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.casemanagers.roles',
    name: 'formattedRoles',
    translationPath: 'tables.casemanagers.roles',
    altName: 'roles',
    render: 'tag',
    sort: true,
  },
  {
    title: 'core.departments',
    name: 'formattedDepartments',
    translationPath: 'tables.casemanagers.departments',
    altName: 'departments',
    render: 'tag',
    sort: true,
    filterField: {
      type: 'select',
      value: undefined,
      // options will be added dynamically
    },
    filterQuery: (q: number) => ({ id: { eq: q } }),
  },
];
