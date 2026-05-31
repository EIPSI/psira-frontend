export enum CalendarOccurrenceType {
  CLINICAL_SESSION = 'CLINICAL_SESSION',
  INDEPENDENT_ASSESSMENT = 'INDEPENDENT_ASSESSMENT',
  SUPERVISION = 'SUPERVISION',
}

export enum CalendarOccurrenceStatus {
  SCHEDULED = 'SCHEDULED',
  OPEN = 'OPEN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DETACHED = 'DETACHED',
}

export enum CalendarEventType {
  SESSION = 'SESSION',
  ASSESSMENT = 'ASSESSMENT',
}

export enum CalendarView {
  MONTH = 'MONTH',
  WEEK = 'WEEK',
  DAY = 'DAY',
}

export enum AssessmentOrigin {
  INDIVIDUAL = 'INDIVIDUAL',
  FIXED_SCHEME = 'FIXED_SCHEME',
  SESSION_BASED = 'SESSION_BASED',
}

export interface CalendarPerson {
  id: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
}

export interface CalendarPatient extends CalendarPerson {
  medicalRecordNo?: string;
}

export interface CalendarAssessment {
  id: number;
  status: string;
  deliveryDate?: string;
  expirationDate?: string;
  assessmentType?: {
    id: number;
    name: string;
  };
}

export interface CalendarOccurrence {
  id: number;
  occurrenceType: CalendarOccurrenceType;
  title: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: CalendarOccurrenceStatus;
  schemeId?: number;
  schemeAssignmentId?: number;
  patientId?: number;
  therapistId?: number;
  supervisorId?: number;
  isDetachedFromTemplate: boolean;
  notes?: string;
  patient?: CalendarPatient;
  therapist?: CalendarPerson;
  supervisor?: CalendarPerson;
  clinicalSession?: {
    id: number;
    sessionNumber?: number;
    clinicalStatus?: string;
  };
  assessments?: CalendarAssessment[];
}

export enum ClinicalSessionKind {
  CLINICAL = 'CLINICAL',
  SUPERVISION = 'SUPERVISION',
}

export interface ClinicalSessionListFilter {
  patientId?: number;
  therapistId?: number;
  supervisorId?: number;
  sessionKind?: ClinicalSessionKind;
  includeCancelled?: boolean;
}

export interface ClinicalSession {
  id: number;
  sessionKind: ClinicalSessionKind;
  sessionNumber?: number;
  clinicalStatus: string;
  clinicalHistory?: string;
  historyLabel: string;
  patientId?: number;
  therapistId?: number;
  supervisorId?: number;
  calendarOccurrence: CalendarOccurrence;
  patient?: any;
  therapist?: any;
  supervisor?: any;
  resources?: any[];
}

export interface CalendarOccurrenceFilter {
  from: Date;
  to: Date;
  patientId?: number;
  therapistId?: number;
  supervisorId?: number;
  occurrenceType?: CalendarOccurrenceType;
}

export interface CalendarEventFilter {
  from: Date;
  to: Date;
  patientId?: number;
  therapistId?: number;
  supervisorId?: number;
  types?: CalendarEventType[];
  sessionKind?: ClinicalSessionKind;
  includeCancelled?: boolean;
}

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  status?: CalendarOccurrenceStatus;
  color?: string;
  editable: boolean;
  deletable: boolean;
  occurrenceId?: number;
  occurrenceType?: CalendarOccurrenceType;
  patientId?: number;
  therapistId?: number;
  supervisorId?: number;
  clinicalSessionId?: number;
  sessionKind?: ClinicalSessionKind;
  sessionNumber?: number;
  assessmentId?: number;
  assessmentOrigin?: AssessmentOrigin;
}
