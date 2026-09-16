import { AppDate } from '@shared/classes/app-date';
import { PatientStatus } from '../../../patients-management/@types/patient-status';

export class PatientStatusModel {
  public static fromJson(json: any): PatientStatus {
    const patientStatus = json || {};
    patientStatus.formattedCreatedAt = patientStatus.createdAt ? AppDate.formatDate(patientStatus.createdAt) : '';
    patientStatus.formattedUpdatedAt = patientStatus.updatedAt ? AppDate.formatDate(patientStatus.updatedAt) : '';
    return patientStatus;
  }

  public static toJson(value: PatientStatus): string {
    return JSON.stringify(value);
  }
}
