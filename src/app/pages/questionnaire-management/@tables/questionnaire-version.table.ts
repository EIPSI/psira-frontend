import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';
import { FormattedQuestionnaireVersion, QuestionnaireStatus } from '../@types/questionnaire';

export const QuestionnaireVersionsColumns: TableColumn<FormattedQuestionnaireVersion>[] = [
  {
    title: 'Abbreviation',
    name: 'abbreviation',
    translationPath: 'questionnaires.abbreviation',
    sort: true,
  },
  {
    title: 'Language',
    name: 'language',
    translationPath: 'questionnaires.language',
    sort: true,
  },
  {
    title: 'ID',
    name: '_id',
    translationPath: 'questionnaires.id',
    sort: true,
  },
  {
    title: 'Name',
    name: 'name',
    translationPath: 'questionnaires.name',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'Status',
    name: 'formattedStatus',
    translationPath: 'questionnaires.formattedStatus',
    altName: 'status',
    render: 'tag',
    sort: true,
    filterField: {
      type: 'select',
      value: undefined,
      options: [
        { label: QuestionnaireStatus.DRAFT, value: QuestionnaireStatus.DRAFT },
        { label: QuestionnaireStatus.PRIVATE, value: QuestionnaireStatus.PRIVATE },
        { label: QuestionnaireStatus.PUBLISHED, value: QuestionnaireStatus.PUBLISHED },
        // { label: QuestionnaireStatus.ARCHIVED, value: QuestionnaireStatus.ARCHIVED },
      ],
    },
  },
  {
    title: 'Keywords',
    name: 'keywords',
    translationPath: 'questionnaires.keywords',
    render: 'array',
    sort: true,
  },
  {
    title: 'Time to complete',
    name: 'timeToComplete',
    translationPath: 'questionnaires.timeToComplete',
    sort: true,
  },
  {
    title: 'Copyright',
    name: 'copyright',
    translationPath: 'questionnaires.copyright',
    sort: true,
  },
  {
    title: 'Website',
    name: 'website',
    translationPath: 'questionnaires.website',
    sort: true,
  },
  {
    title: 'License',
    name: 'license',
    translationPath: 'questionnaires.license',
    sort: true,
  },
  {
    title: 'Created at',
    name: 'createdAt',
    translationPath: 'questionnaires.createdAt',
    render: 'date',
    sort: true,
  },
];
