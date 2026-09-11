import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';
import { FormattedScript, Scripts } from '../@types/scripts';

export const ScriptColumns: TableColumn<Partial<FormattedScript>>[] = [
  {
    title: 'forms.scripts.name',
    name: 'name',
    translationPath: 'tables.scripts.name',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'forms.scripts.version',
    name: 'version',
    translationPath: 'tables.scripts.version',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'forms.scripts.creator',
    name: 'creator',
    translationPath: 'tables.scripts.creator',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'forms.scripts.reports',
    name: 'formattedReports',
    translationPath: 'tables.scripts.reports',
    render: 'tag',
    filterField: {
      type: 'select',
      value: undefined,
      // options will be added dynamically
    },
    filterQuery: (q: number) => (q ? { id: { eq: q } } : { id: { is: null } }),
  },
  {
    title: 'forms.scripts.repositoryLink',
    name: 'repositoryLink',
    translationPath: 'tables.scripts.repositoryLink',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.reports.createdAt',
    name: 'createdAt',
    translationPath: 'tables.reports.createdAt',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
];
