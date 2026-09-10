import { TagInfo } from '@shared/@modules/master-data/@types/list';
import { Role } from '@app/pages/administration/@types/role';

export interface Reports {
  id: number;
  anonymus: boolean;
  name: string;
  description: string;
  status: boolean;
  appName: string;
  repositoryLink: any;
  url: string;
  resources: string;
  roles: Role[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ShinyApp {
  appName: string;
  title: string;
  url: string;
}

export interface ReportSession {
  id: number;
  reportId: number;
  userId: number;
  patientId?: number;
  contextType?: string;
  contextParams?: string;
  closedBy?: string;
  startedAt: string;
  lastSeenAt: string;
  endedAt?: string;
  durationSeconds: number;
  active: boolean;
  report?: Pick<Reports, 'id' | 'name'>;
  user?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  patient?: {
    id: number;
    firstName: string;
    lastName: string;
    medicalRecordNo?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOneReportInput {
  report: CreateReportInput;
}

export interface ReportRole {
  name: string;
  id: number;
  roleId: number;
  role: Role;
}

export interface UpdateOneReportInput {
  id: number;
  update: UpdateReport;
}

export interface DeleteOneReportInput {
  id: number;
}

export interface UpdateReport {
  id?: number;
  anonymus?: boolean;
  name?: string;
  description?: string;
  status?: boolean;
  appName?: string;
  repositoryLink?: any;
  url?: string;
  resources?: string;
  roles: number[];
}

export interface CreateReportInput {
  id?: number;
  anonymus?: boolean;
  name?: string;
  description?: string;
  status?: boolean;
  appName?: string;
  repositoryLink?: any;
  url?: string;
  resources?: string;
  roles: number[];
}

export interface FormattedReport extends Reports {
  formattedRoles: TagInfo[];
}
