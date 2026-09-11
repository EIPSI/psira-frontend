import { Contact } from '@app/pages/patients-management/@types/contact';
import { Informant } from '@app/pages/patients-management/@types/informant';
import { User } from '@app/pages/user-management/@types/user';
import { PatientStatus } from '@app/pages/patients-management/@types/patient-status';
import { Department } from '../../administration/@types/department';

export interface Patient {
  id?: number;
  userId?: number;
  statusId?: number;
  departmentIds?: number[];
  caseManagerIds?: number[];
  skippedAutomationIds?: number[];
  medicalRecordNo?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressApartment?: string;
  addressPlace?: string;
  addressPostalCode?: string;
  addressCountryCode?: string;
  gender?: string;
  birthDate?: string;
  birthCountryCode?: string;
  nationality?: string;
  createdAt?: string;
  updatedAt?: string;
  emergencyContacts?: Contact[];
  informants?: Informant[];
  departments?: Department[];
  caseManagers?: User[];
  status?: PatientStatus;
}
