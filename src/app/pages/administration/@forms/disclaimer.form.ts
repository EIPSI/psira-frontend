import { Form } from '../../../@shared/components/form/@types/form';

export const DisclaimerForm: Form = {
  groups: [
    {
      fields: [
        {
          value: '',
          name: 'description',
          title: 'tables.disclaimer.textInformation',
          label: 'tables.disclaimer.textInformation',
          translationPath: 'tables.disclaimer.textInformation',
          description: 'disclaimers.descriptionHelp',
          type: 'textArea',
          validationMessage: 'disclaimers.descriptionValidation',
          isRequired: false,
          span: 24,
          options: [],
        },
      ],
    },
  ],
};
