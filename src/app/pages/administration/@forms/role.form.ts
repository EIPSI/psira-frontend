import { Form } from '@shared/components/form/@types/form';

export const RoleForm: Form = {
  submitButtonText: 'roles.saveRole',
  editButtonText: 'roles.editRole',
  submitButtonClass: 'full-width',
  groups: [
    {
      fields: [
        {
          value: '',
          name: 'name',
          title: 'tables.roles.name',
          label: 'tables.roles.name',
          description: 'roles.nameDescription',
          type: 'text',
          validationMessage: 'roles.nameValidation',
          isRequired: true,
          span: 24,
          options: [],
        },
        {
          value: '',
          name: 'hierarchy',
          title: 'tables.roles.hierarchy',
          label: 'tables.roles.hierarchy',
          description: 'roles.hierarchyDescription',
          type: 'number',
          min: 1,
          max: 1000,
          validationMessage: 'roles.hierarchyValidation',
          isRequired: true,
          disabled: true,
          span: 24,
          options: [],
        },
      ],
    },
  ],
};
