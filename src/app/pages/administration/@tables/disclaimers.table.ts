import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';
import { FormattedDisclaimer } from '../@types/disclaimers';

export const DisclaimersColumns: TableColumn<Partial<FormattedDisclaimer>>[] = [
  {
    title: 'tables.disclaimer.type',
    name: 'formattedType',
    translationPath: 'tables.disclaimer.type',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.disclaimer.textInformation',
    name: 'description',
    translationPath: 'tables.disclaimer.textInformation',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'tables.disclaimer.lastUpdate',
    name: 'updatedAt',
    translationPath: 'tables.disclaimer.lastUpdate',
    sort: true,
  },
];
