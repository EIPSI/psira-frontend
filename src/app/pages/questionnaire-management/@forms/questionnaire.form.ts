import { CreateQuestionnaireInput, QuestionnaireStatus } from './../@types/questionnaire';
import { Form } from '../../../@shared/components/form/@types/form';
import { UpdateQuestionnaireInput } from '../@types/questionnaire';
import { getNames } from '@cospired/i18n-iso-languages';

export const QuestionnaireForm: Form & { groups: { fields: { name: keyof CreateQuestionnaireInput }[] }[] } = {
  submitButtonText: 'questionnaires.uploadQuestionnaire',
  editButtonText: 'questionnaires.editQuestionnaire',
  groups: [
    {
      fields: [
        {
          value: '',
          name: 'name',
          title: 'questionnairesForm.name',
          translationPath: 'questionnairesForm.name',
          description: 'questionnairesForm.name',
          type: 'text',
          span: 12,
        },
        {
          value: undefined,
          name: 'excelFile',
          title: 'questionnairesForm.excelFile',
          translationPath: 'questionnairesForm.excelFile',
          description: 'questionnairesForm.excelFile',
          type: 'file',
          span: 12,
          isRequired: true,
        },
        {
          value: QuestionnaireStatus.DRAFT,
          name: 'status',
          title: 'questionnairesForm.status',
          translationPath: 'questionnairesForm.status',
          description: 'questionnairesForm.status',
          type: 'select',
          span: 12,
          isRequired: true,
          options: [
            { value: QuestionnaireStatus.PUBLISHED, label: 'questionnaires.statusPublished' },
          ],
        },
        {
          value: '',
          name: 'language',
          title: 'questionnairesForm.language',
          translationPath: 'questionnairesForm.language',
          description: 'questionnairesForm.language',
          type: 'select',
          span: 12,
          isRequired: true,
          // TODO: get from correct language
          options: Object.entries(getNames('en'))
            .map(([value, label]) => ({ label, value }))
            .sort((prev, next) => prev.label.localeCompare(next.label)),
        },
        {
          value: '',
          name: 'copyright',
          title: 'questionnairesForm.copyright',
          translationPath: 'questionnairesForm.copyright',
          description: 'questionnairesForm.copyright',
          type: 'text',
          span: 12,
          isRequired: true,
        },
        {
          value: undefined,
          name: 'timeToComplete',
          title: 'questionnairesForm.timeToComplete',
          translationPath: 'questionnairesForm.timeToComplete',
          description: 'questionnairesForm.timeToComplete',
          type: 'number',
          span: 12,
        },
        {
          value: '',
          name: 'website',
          title: 'questionnairesForm.website',
          translationPath: 'questionnairesForm.website',
          description: 'questionnairesForm.website',
          type: 'text',
          span: 12,
        },
        {
          value: '',
          name: 'license',
          title: 'questionnairesForm.license',
          translationPath: 'questionnairesForm.license',
          description: 'questionnairesForm.license',
          type: 'text',
          span: 12,
        },
      ],
    },
  ],
};

export const QuestionnaireUpdateForm: Form & { groups: { fields: { name: keyof UpdateQuestionnaireInput }[] }[] } = {
  submitButtonText: 'questionnaires.uploadQuestionnaire',
  editButtonText: 'questionnaires.editQuestionnaire',
  groups: [
    {
      fields: [
        {
          value: '',
          name: 'name',
          title: 'questionnairesForm.name',
          translationPath: 'questionnairesForm.name',
          description: 'questionnairesForm.name',
          type: 'text',
          span: 12,
          isRequired: true,
        },
        {
          value: QuestionnaireStatus.DRAFT,
          name: 'status',
          title: 'questionnairesForm.status',
          translationPath: 'questionnairesForm.status',
          description: 'questionnairesForm.status',
          type: 'select',
          span: 12,
          isRequired: true,
          options: [
            { value: QuestionnaireStatus.PUBLISHED, label: 'questionnaires.statusPublished' },
          ],
        },
        {
          value: '',
          name: 'language',
          title: 'questionnairesForm.language',
          translationPath: 'questionnairesForm.language',
          description: 'questionnairesForm.language',
          type: 'select',
          span: 12,
          isRequired: true,
          // TODO: get from correct language
          options: Object.entries(getNames('en'))
            .map(([value, label]) => ({ label, value }))
            .sort((prev, next) => prev.label.localeCompare(next.label)),
        },
        {
          value: '',
          name: 'copyright',
          title: 'questionnairesForm.copyright',
          translationPath: 'questionnairesForm.copyright',
          description: 'questionnairesForm.copyright',
          type: 'text',
          span: 12,
          isRequired: true,
        },
        {
          value: undefined,
          name: 'timeToComplete',
          translationPath: 'questionnairesForm.timeToComplete',
          title: 'questionnairesForm.timeToComplete',
          description: 'questionnairesForm.timeToComplete',
          type: 'number',
          span: 12,
        },
        {
          value: '',
          name: 'website',
          title: 'questionnairesForm.website',
          translationPath: 'questionnairesForm.website',
          description: 'questionnairesForm.website',
          type: 'text',
          span: 12,
        },
        {
          value: '',
          name: 'license',
          title: 'questionnairesForm.license',
          translationPath: 'questionnairesForm.license',
          description: 'questionnairesForm.license',
          type: 'text',
          span: 12,
        },
      ],
    },
  ],
};
