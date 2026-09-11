import { TagInfo } from '../../../@shared/@modules/master-data/@types/list';
import { User } from '@app/pages/user-management/@types/user';

export interface Department {
  id?: number;
  name: string;
  description: string;
  active: boolean;
  appliedRoleCodes?: string[];
  defaultRoleCodes?: string[];
  formattedAppliedRoles?: string;
  formattedDefaultRoles?: string;
  createdAt?: number;
  updatedAt?: number;
  users: User[];
}

export interface FormattedDepartment extends Department {
  formattedStatus: TagInfo;
}

export interface UpdateOneDepartmentInput {
  id: number;
  update: UpdateDepartment;
}

export interface UpdateDepartment {
  name: string;
  description: string;
  active: boolean;
  appliedRoleCodes?: string[];
  defaultRoleCodes?: string[];
}
