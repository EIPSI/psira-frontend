import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';
import { FormattedDisclaimer } from '../@types/disclaimers';

export const DisclaimersColumns: TableColumn<Partial<FormattedDisclaimer>>[] = [
  {
    title: 'Type',
    name: 'formattedType',
    translationPath: 'tables.disclaimer.type',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'Text Information',
    name: 'description',
    translationPath: 'tables.disclaimer.textInformation',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'Last Update',
    name: 'updatedAt',
    translationPath: 'tables.disclaimer.lastUpdate',
    sort: true,
  },
];
