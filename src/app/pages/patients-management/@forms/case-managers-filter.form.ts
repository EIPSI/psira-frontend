import { Form } from '@shared/components/form/@types/form';

export const CaseManagersFilterForm: Form = {
  groups: [
    {
      fields: [
        {
          title: '',
          label: 'forms.patients.searchKeyword',
          name: 'searchKeyword',
          type: 'text',
          isRequired: false,
          description: 'forms.common.enterValue',
          validationMessage: '',
          span: 24,
          value: '',
        },
        {
          title: '',
          label: 'forms.patients.patientNames',
          name: 'patientId',
          type: 'search',
          isRequired: false,
          description: 'forms.common.enterValue',
          validationMessage: '',
          span: 24,
          value: '',
          options: [],
        },
        {
          title: '',
          label: 'forms.patients.caseManagerNames',
          name: 'caseManagerId',
          type: 'search',
          isRequired: false,
          description: 'forms.common.enterValue',
          validationMessage: '',
          span: 24,
          value: '',
          options: [],
        },
      ],
    },
  ],
};
