import { TableColumn } from '../../../@shared/@modules/master-data/@types/list';
import { FormattedQuestionnaireVersion, QuestionnaireStatus } from '../@types/questionnaire';

export const QuestionnaireVersionsColumns: TableColumn<FormattedQuestionnaireVersion>[] = [
  {
    title: 'questionnaires.abbreviation',
    name: 'abbreviation',
    translationPath: 'questionnaires.abbreviation',
    sort: true,
  },
  {
    title: 'questionnaires.language',
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
    title: 'questionnaires.name',
    name: 'name',
    translationPath: 'questionnaires.name',
    sort: true,
    filterField: {
      type: 'text',
      value: undefined,
    },
  },
  {
    title: 'questionnaires.formattedStatus',
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
    title: 'questionnaires.keywords',
    name: 'keywords',
    translationPath: 'questionnaires.keywords',
    render: 'array',
    sort: true,
  },
  {
    title: 'questionnaires.timeToComplete',
    name: 'timeToComplete',
    translationPath: 'questionnaires.timeToComplete',
    sort: true,
  },
  {
    title: 'questionnaires.copyright',
    name: 'copyright',
    translationPath: 'questionnaires.copyright',
    sort: true,
  },
  {
    title: 'questionnaires.website',
    name: 'website',
    translationPath: 'questionnaires.website',
    sort: true,
  },
  {
    title: 'questionnaires.license',
    name: 'license',
    translationPath: 'questionnaires.license',
    sort: true,
  },
  {
    title: 'questionnaires.createdAt',
    name: 'createdAt',
    translationPath: 'questionnaires.createdAt',
    render: 'date',
    sort: true,
  },
];
