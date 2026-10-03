import { Patient } from '@app/pages/patients-management/@types/patient';
import { User } from '@app/pages/user-management/@types/user';

export type AssignmentRequestKind = 'CASE_MANAGER' | 'SUPERVISOR';
export type AssignmentRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface AssignmentRequest {
  id: number;
  kind: AssignmentRequestKind;
  status: AssignmentRequestStatus;
  patientId?: number;
  therapistId?: number;
  assigneeId: number;
  requesterId: number;
  createdAt?: string;
  respondedAt?: string;
  patient?: Patient;
  therapist?: User;
  assignee?: User;
  requester?: User;
}
