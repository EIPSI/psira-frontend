import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';
import { Assessment, FormattedAssessment } from '@app/pages/assessment/@types/assessment';
import { environment } from '@env/environment';
import { User } from '@app/pages/user-management/@types/user';

export const AssessmentsPatientsTable: TableColumn<FormattedAssessment>[] = [
  {
    title: 'tables.assessmentsPatients.title',
    name: 'formattedAssessmentType',
    altName: 'assessmentType',
    translationPath: 'tables.assessmentsPatients.title',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
    filterQuery: (q: number) =>
    q
      ? {
          or: [
            { name: { iLike: `%${q}%` } },
          ] as Array<{ [K in keyof Assessment]: any }>,
        }
      : {},
  },
  {
    title: 'tables.assessmentsPatients.manager',
    name: 'formattedClinician',
    altName: 'clinician',
    translationPath: 'tables.assessmentsPatients.manager',
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
          ] as Array<{ [K in keyof User]: any }>,
        }
      : {},
  },
  {
    title: 'tables.assessmentsPatients.origin',
    name: 'formattedOrigin',
    altName: 'origin',
    render: 'tag',
    sort: true,
  },
  {
    title: 'tables.assessmentsPatients.linkedSession',
    name: 'linkedSessionLabel',
    sort: true,
  },
  // {
  //   title: 'tables.patients.informants',
  //   name: 'informantType',
  //   translationPath: 'tables.assessmentsPatients.informant',
  //   sort: true,
  //   filterField: {
  //     type: 'text',
  //     value: undefined,
  //   },
  // },
  {
    name: 'formatedQuestionnaires',
    title: 'tables.assessmentsPatients.questionnaires',
    render: 'questAvatar',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.patients.status',
    name: 'formattedStatus',
    altName: 'status',
    translationPath: 'tables.assessmentsPatients.status',
    render: 'tag',
    sort: true,
    filterField: {
      type: 'select',
      value: undefined,
      // options added dynamically
    },
  },
  // {
  //   title: 'tables.assessmentsPatients.expirationDate',
  //   altName: 'expirationDate',
  //   name: 'formatedExpirationDate',
  //   translationPath: 'tables.assessmentsPatients.expirationDate',
  //   sort: true,
  //   filterField: {
  //     type: 'dateRange',
  //     value: undefined,
  //     title: 'tables.assessmentsPatients.expirationDate',
  //   },
  // },
  {
    name: 'submissionDate',
    title: 'tables.assessmentsPatients.submissionDate',
    translationPath: 'plannedAssessments.submissionDate',
    render: 'date',
    sort: true,
  },
  {
    title: 'tables.assessmentsPatients.emailStatus',
    name: 'emailFormatedStatus',
    altName: 'emailStatus',
    render: 'tag',
    translationPath: 'tables.assessmentsPatients.emailStatus',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.assessmentsPatients.deliveryDate',
    name: 'formatedDeliveryDate',
    altName: 'deliveryDate',
    translationPath: 'tables.assessmentsPatients.deliveryDate',
    sort: true,
    filterField: {
      type: 'dateRange',
      value: undefined,
      title: 'tables.assessmentsPatients.deliveryDate',
    },
  },
];

if(!environment.email){
  AssessmentsPatientsTable.pop();
}
