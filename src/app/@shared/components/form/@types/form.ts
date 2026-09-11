import { FieldGroup } from './field.group';

export interface Form {
  layout?: 'grid' | 'definition';
  labelWidth?: string;
  valueAlign?: 'left' | 'right';
  submitButtonText?: string;
  editButtonText?: string;
  submitButtonClass?: string;
  groups: FieldGroup[];
}
