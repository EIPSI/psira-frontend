import { Form } from '../../../@shared/components/form/@types/form';

export const PatientStatusForm: Form = {
  submitButtonText: 'patientStatuses.submitPatientStatus',
  editButtonText: 'patientStatuses.submitPatientStatus',
  submitButtonClass: 'full-width',
  groups: [
    {
      fields: [
        {
          value: '',
          name: 'name',
          title: 'forms.patientStatuses.name',
          label: 'forms.patientStatuses.name',
          description: 'patientStatuses.nameDescription',
          translationPath: 'forms.patientStatuses.name',
          type: 'text',
          validationMessage: 'patientStatuses.nameValidation',
          isRequired: true,
          span: 24,
          options: [],
        },
        {
          value: '',
          name: 'description',
          title: 'forms.patientStatuses.description',
          label: 'forms.patientStatuses.description',
          translationPath: 'forms.patientStatuses.description',
          description: 'patientStatuses.descriptionHelp',
          type: 'text',
          validationMessage: 'patientStatuses.descriptionValidation',
          isRequired: false,
          span: 24,
          options: [],
        },
      ],
    },
  ],
};
