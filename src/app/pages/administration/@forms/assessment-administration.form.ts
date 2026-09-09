import { Form } from '@shared/components/form/@types/form';
import { AssessmentAdministrationStatus } from '../@types/assessment-administration';

export const AssessmentAdministrationForm: Form = {
  submitButtonText: 'assessmentAdministration.createAssessmentName',
  editButtonText: 'assessmentAdministration.editAssessmentName',
  submitButtonClass: 'full-width',
  groups: [
    {
      fields: [
        {
          value: '',
          name: 'name',
          title: 'forms.assessmentAdministration.typeName',
          label: 'forms.assessmentAdministration.typeName',
          description: 'forms.assessmentAdministration.typeNameDescription',
          translationPath: 'forms.assessmentAdministration.typeName',
          type: 'text',
          validationMessage: 'forms.assessmentAdministration.typeNameValidation',
          isRequired: true,
          span: 24,
          options: [],
        },
        {
          value: '',
          name: 'status',
          title: 'forms.assessmentAdministration.status',
          label: 'forms.assessmentAdministration.status',
          description: '',
          translationPath: 'tables.assessmentAdministration.status',
          type: 'select',
          validationMessage: '',
          isRequired: true,
          span: 24,
          options: [
            { label: AssessmentAdministrationStatus.ACTIVE, value: AssessmentAdministrationStatus.ACTIVE },
            { label: AssessmentAdministrationStatus.INACTIVE, value: AssessmentAdministrationStatus.INACTIVE },
          ],
        },
      ],
    },
  ],
};
