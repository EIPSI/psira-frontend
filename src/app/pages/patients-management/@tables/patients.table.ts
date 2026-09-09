import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';
import { FormattedPatient } from '../@types/formatted-patient';
import { CaseManager } from '../@types/case-manager';

export const PatientColumns: TableColumn<FormattedPatient>[] = [
  {
    title: 'tables.patients.firstName',
    name: 'firstName',
    translationPath: 'tables.patients.firstName',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.patients.middleName',
    name: 'middleName',
    translationPath: 'tables.patients.middleName',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.patients.lastName',
    name: 'lastName',
    translationPath: 'tables.patients.lastName',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'forms.patients.id',
    name: 'medicalRecordNo',
    translationPath: 'tables.patients.medicalRecordNo',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'forms.patients.gender',
    name: 'gender',
    translationPath: 'tables.patients.gender',
    sort: true,
    filterField: {
      type: 'radio',
      value: undefined,
      options: [
        { label: 'forms.patients.genderFemale', value: 'female' },
        { label: 'forms.patients.genderMale', value: 'male' },
        { label: 'forms.patients.genderOther', value: 'other' }
      ],
    },
  },
  {
    title: 'forms.patients.birthDate',
    name: 'birthDate',
    translationPath: 'tables.patients.birthDate',
    render: 'date',
    sort: true,
    filterField: {
      type: 'date',
      value: undefined,
      title: 'forms.patients.birthDate',
    },
  },
  {
    title: 'tables.patients.status',
    name: 'formattedStatus',
    translationPath: 'tables.patients.status',
    altName: 'statusId',
    render: 'tag',
    sort: true,
    filterField: {
      type: 'select',
      value: undefined,
      // options added dynamically
    },
  },
  {
    title: 'tables.patients.informants',
    name: 'formattedInformants',
    translationPath: 'tables.patients.informants',
    render: 'avatar',
    sort: true,
  },
  {
    title: 'tables.patients.caseManager',
    name: 'formattedCaseManagers',
    translationPath: 'tables.patients.caseManager',
    altName: 'caseManagers',
    render: 'avatar',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
    filterQuery: (q: number) =>
      q
        ? {
            or: [
              { firstName: { iLike: `%${q}%` } },
              { middleName: { iLike: `%${q}%` } },
              { lastName: { iLike: `%${q}%` } },
              { workID: { iLike: `%${q}%` } },
            ] as Array<{ [K in keyof CaseManager]: any }>,
          }
        : {},
  },
  {
    title: 'tables.patients.createdAt',
    name: 'createdAt',
    translationPath: 'tables.patients.createdAt',
    render: 'date',
    sort: true,
    filterField: {
      type: 'dateRange',
      value: undefined,
      title: 'tables.patients.createdAt',
    },
  },
];
