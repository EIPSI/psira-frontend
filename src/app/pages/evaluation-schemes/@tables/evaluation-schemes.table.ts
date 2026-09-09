import { TableColumn } from '@shared/@modules/master-data/@types/list';
import { EvaluationScheme } from '../@types/evaluation-scheme';

export const EvaluationSchemesTable: TableColumn<EvaluationScheme>[] = [
  {
    title: 'evaluationSchemes.name',
    name: 'name',
    translationPath: 'evaluationSchemes.name',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'evaluationSchemes.type',
    name: 'formattedSchemeType',
    altName: 'schemeType',
    translationPath: 'evaluationSchemes.type',
    render: 'tag',
    sort: true,
  },
  {
    title: 'evaluationSchemes.description',
    name: 'description',
    translationPath: 'evaluationSchemes.description',
    sort: true,
  },
  {
    title: 'evaluationSchemes.status',
    name: 'formattedStatus',
    altName: 'active',
    translationPath: 'evaluationSchemes.status',
    render: 'tag',
    sort: true,
  },
  {
    title: 'tables.department.createdAt',
    name: 'createdAt',
    translationPath: 'tables.department.createdAt',
    render: 'date',
    sort: true,
  },
];
