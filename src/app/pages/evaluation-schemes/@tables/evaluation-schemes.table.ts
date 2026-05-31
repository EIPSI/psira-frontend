import { TableColumn } from '@shared/@modules/master-data/@types/list';
import { EvaluationScheme } from '../@types/evaluation-scheme';

export const EvaluationSchemesTable: TableColumn<EvaluationScheme>[] = [
  {
    title: 'Name',
    name: 'name',
    translationPath: 'evaluationSchemes.name',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'Type',
    name: 'formattedSchemeType',
    altName: 'schemeType',
    translationPath: 'evaluationSchemes.type',
    render: 'tag',
  },
  {
    title: 'Description',
    name: 'description',
    translationPath: 'evaluationSchemes.description',
  },
  {
    title: 'Status',
    name: 'formattedStatus',
    altName: 'active',
    translationPath: 'evaluationSchemes.status',
    render: 'tag',
  },
  {
    title: 'Created At',
    name: 'createdAt',
    translationPath: 'tables.department.createdAt',
    render: 'date',
    sort: true,
  },
];
