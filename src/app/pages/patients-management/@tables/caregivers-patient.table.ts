import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';
import { Caregiver } from '../@types/caregiver';

export const CaregiversPatientTable: TableColumn<Caregiver>[] = [
  {
    title: 'tables.patients.firstName',
    name: 'firstName',
    translationPath: 'tables.contact.firstName',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.patients.middleName',
    name: 'middleName',
    translationPath: 'tables.contact.middleName',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.patients.lastName',
    name: 'lastName',
    translationPath: 'tables.contact.lastName',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.contact.email',
    name: 'email',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'forms.patients.phone',
    name: 'phone',
    translationPath: 'tables.contact.phone',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'forms.patients.relation',
    name: 'relation',
    translationPath: 'tables.contact.relation',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'forms.patients.emergency',
    name: 'emergency',
    translationPath: 'tables.contact.emergency',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'forms.patients.note',
    name: 'note',
    translationPath: 'tables.contact.note',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
];
