import { User } from './../../user-management/@types/user';
import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';
import { Assessment, FormattedAssessment, QuestionnaireAssessment } from '../@types/assessment';
import { Patient } from '@app/pages/patients-management/@types/patient';
import { environment } from '@env/environment';

export const AssessmentTable: TableColumn<FormattedAssessment>[] = [
  {
    name: 'formattedAssessmentType',
    altName: 'assessmentType',
    title: 'plannedAssessments.name',
    translationPath: 'plannedAssessments.name',
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
    name: 'patientMedicalRecordNo',
    title: 'plannedAssessments.patientMedicalRecordNo',
    translationPath: 'plannedAssessments.patientMedicalRecordNo',
    sort: true,
  },
  {
    name: 'formattedOrigin',
    altName: 'origin',
    title: 'plannedAssessments.origin',
    translationPath: 'plannedAssessments.origin',
    render: 'tag',
    sort: true,
  },
  {
    name: 'linkedSessionLabel',
    title: 'plannedAssessments.linkedSession',
    translationPath: 'plannedAssessments.linkedSession',
    sort: true,
  },
  {
    name: 'formattedPatient',
    altName: 'patient',
    title: 'plannedAssessments.formattedPatient',
    translationPath: 'plannedAssessments.formattedPatient',
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
              { medicalRecordNo: { iLike: `%${q}%` } },
            ] as Array<{ [K in keyof Patient]: any }>,
          }
        : {},
  },
  {
    name: 'formattedClinician',
    altName: 'clinician',
    title: 'plannedAssessments.formattedClinician',
    translationPath: 'plannedAssessments.formattedClinician',
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
  // {
  //   name: 'informantType',
  //   title: 'plannedAssessments.informant',
  //   translationPath: 'plannedAssessments.informant',
  //   sort: true,
  //   filterField: {
  //     type: 'text',
  //     value: undefined,
  //   },
  // },
  {
    name: 'formatedQuestionnaires',
    title: 'plannedAssessments.questionnaires',
    translationPath: 'plannedAssessments.questionnaires',
    render: 'questAvatar',
    sort: true,
    // filterField: {
    //   type: 'text',
    //   value: undefined,
    // },
  },
  {
    name: 'formattedStatus',
    altName: 'status',
    title: 'plannedAssessments.formattedStatus',
    sort: true,
    translationPath: 'plannedAssessments.formattedStatus',
    render: 'tag',
  },
  // {
  //   name: 'expirationDate',
  //   title: 'plannedAssessments.expirationDate',
  //   translationPath: 'plannedAssessments.expirationDate',
  //   render: 'date',
  //   sort: true,
  //   filterField: {
  //     type: 'dateRange',
  //     value: undefined,
  //     title: 'plannedAssessments.expirationDate',
  //   },
  // },
  {
    name: 'submissionDate',
    title: 'plannedAssessments.submissionDate',
    translationPath: 'plannedAssessments.submissionDate',
    render: 'date',
    sort: true,
  },
  {
    name: 'emailFormatedStatus',
    altName: 'emailStatus',
    title: 'plannedAssessments.emailStatus',
    translationPath: 'plannedAssessments.emailStatus',
    render: 'tag',
    sort: true
  },
  {
    name: 'deliveryDate',
    title: 'plannedAssessments.deliveryDate',
    translationPath: 'plannedAssessments.deliveryDate',
    render: 'date',
    sort: true,
    filterField: {
      type: 'dateRange',
      value: undefined,
      title: 'plannedAssessments.deliveryDate',
    },
  },
];

if(!environment.email){
  AssessmentTable.pop();
}
