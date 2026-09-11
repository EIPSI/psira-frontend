import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';
import { FormattedAssessmentAdministration } from '@app/pages/administration/@types/assessment-administration';

export const AssessmentAdministrationColumns: TableColumn<Partial<FormattedAssessmentAdministration>>[] = [
  {
    title: 'tables.assessmentAdministration.assessmentType',
    name: 'name',
    translationPath: 'tables.assessmentAdministration.assessmentType',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.department.formattedStatus',
    name: 'formattedStatus',
    translationPath: 'tables.department.formattedStatus',
    render: 'tag',
    sort: true,
    filterField: {
      type: 'select',
      value: undefined,
      options: [
        { label: 'core.active', value: true },
        { label: 'core.inactive', value: false },
      ],
    },
  },
  {
    title: 'tables.assessmentAdministration.lastUpdate',
    name: 'updatedAt',
    translationPath: 'tables.assessmentAdministration.lastUpdate',
    sort: true,
  },
];
