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

export enum AddClinicalSessionSchemesApplicationMode {
  RELATIVE_FROM_SESSION = 'RELATIVE_FROM_SESSION',
  ORIGINAL_SESSION_NUMBER = 'ORIGINAL_SESSION_NUMBER',
}

export enum ClinicalSessionSchemeApplicationStatus {
  ACTIVE = 'ACTIVE',
  STOPPED = 'STOPPED',
  REPLACED = 'REPLACED',
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
  questionnaireAssessmentId?: string;
  status: string;
  deliveryDate?: string;
  expirationDate?: string;
  schemeRelativeSessionNumber?: number;
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
  responsibleUsers?: CalendarPerson[];
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

export enum TreatmentCycleStatus {
  ACTIVE = 'ACTIVE',
  FINALIZED = 'FINALIZED',
  FINALIZATION_CANCELLED = 'FINALIZATION_CANCELLED',
}

export enum CaseEventReasonContext {
  SESSION_CANCELLATION = 'SESSION_CANCELLATION',
  SUPERVISION_SESSION_CANCELLATION = 'SUPERVISION_SESSION_CANCELLATION',
  TREATMENT_FINALIZATION = 'TREATMENT_FINALIZATION',
  SUPERVISION_FINALIZATION = 'SUPERVISION_FINALIZATION',
  NEW_TREATMENT = 'NEW_TREATMENT',
  NEW_SUPERVISION = 'NEW_SUPERVISION',
}

export interface CaseEventReason {
  id: number;
  context: CaseEventReasonContext;
  label: string;
  nextLevelLabel?: string;
  parentId?: number | null;
  departmentId?: number | null;
  active: boolean;
  isOther: boolean;
  sortOrder: number;
  children?: CaseEventReason[];
}

export interface CaseEventReasonTree {
  id: number;
  context: CaseEventReasonContext;
  departmentId?: number | null;
  active: boolean;
  levelLabels?: string[];
}

export enum CaseHistoryEntryKind {
  NOTE = 'NOTE',
  TREATMENT_FINALIZATION = 'TREATMENT_FINALIZATION',
  FINALIZATION_CANCELLED = 'FINALIZATION_CANCELLED',
  NEW_TREATMENT = 'NEW_TREATMENT',
}

export interface TreatmentCycle {
  id: number;
  cycleKind: ClinicalSessionKind;
  status: TreatmentCycleStatus;
  cycleNumber: number;
  patientId?: number;
  therapistId?: number;
  startedAt: string;
  finalizedAt?: string;
  finalizationReasonSnapshot?: string;
  finalizationNote?: string;
  newTreatmentReasonSnapshot?: string;
  newTreatmentNote?: string;
  daysSincePreviousFinalization?: number;
  previousCycleCount?: number;
  lastSessionNumber?: number;
  finalizationUndoExpiresAt?: string;
}

export interface CaseHistoryEntry {
  id: number;
  entryKind: CaseHistoryEntryKind;
  cycleKind: ClinicalSessionKind;
  patientId?: number;
  therapistId?: number;
  treatmentCycleId?: number;
  clinicalSessionId?: number;
  sessionNumber?: number;
  occurredAt: string;
  title: string;
  content?: string;
  reasonSnapshot?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ClinicalSessionModality {
  IN_PERSON = 'IN_PERSON',
  ONLINE = 'ONLINE',
}

export enum ClinicalSessionCancellationType {
  RESCHEDULED = 'RESCHEDULED',
  NO_SHOW = 'NO_SHOW',
}

export enum ClinicalSessionRepeatUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export enum ClinicalSessionRepeatEndMode {
  NEVER = 'NEVER',
  ON_DATE = 'ON_DATE',
  AFTER_COUNT = 'AFTER_COUNT',
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
  modality?: ClinicalSessionModality;
  clinicalStatus: string;
  clinicalHistory?: string;
  historyLabel: string;
  patientId?: number;
  therapistId?: number;
  supervisorId?: number;
  responsibleUsers?: CalendarPerson[];
  calendarOccurrence: CalendarOccurrence;
  patient?: any;
  therapist?: any;
  supervisor?: any;
  resources?: ClinicalSessionResource[];
  cancellationType?: ClinicalSessionCancellationType;
  cancellationReasonSnapshot?: string;
  cancellationComment?: string;
  cancelledSessionNumber?: number;
  cancelledStartAt?: string;
}

export interface ClinicalSessionFollowUpVersion {
  id: number;
  clinicalSessionId: number;
  previousText?: string;
  nextText?: string;
  editedByUserId?: number;
  createdAt: string;
  editedBy?: CalendarPerson;
}

export interface ClinicalSessionFollowUpSettings {
  id: number;
  editWindowDays: number;
  updatedAt: string;
}

export interface ClinicalSessionSchemeApplication {
  id: number;
  schemeId: number;
  sessionKind: ClinicalSessionKind;
  patientId?: number;
  therapistId?: number;
  startClinicalSessionId: number;
  startSessionNumber?: number;
  applicationMode: AddClinicalSessionSchemesApplicationMode;
  status: ClinicalSessionSchemeApplicationStatus;
  stoppedAtClinicalSessionId?: number;
  scheme?: {
    id: number;
    name: string;
  };
}

export interface ClinicalSessionResource {
  id: number;
  schemeRelativeSessionNumber?: number;
  resourceKind: string;
  status: string;
  activationAnchor?: string;
  activationOffsetMinutes?: number;
  availabilityDurationMinutes?: number;
  reminderMinutes?: number[];
  activationAt?: string;
  expirationAt?: string;
  replacementResourceId?: number;
  replacedResourceId?: number;
  assessment?: CalendarAssessment;
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
  responsibleUserIds?: number[];
  clinicalSessionId?: number;
  sessionKind?: ClinicalSessionKind;
  sessionNumber?: number;
  modality?: ClinicalSessionModality;
  assessmentId?: number;
  clinicalSessionResourceId?: number;
  assessmentOrigin?: AssessmentOrigin;
  cancellationType?: ClinicalSessionCancellationType;
  cancellationReasonSnapshot?: string;
  cancellationComment?: string;
}

export interface RestructureClinicalSessionsInput {
  clinicalSessionId: number;
  startAt: Date;
  endAt: Date;
  every: number;
  unit: ClinicalSessionRepeatUnit;
  repeatOnDays?: number[];
  endMode: ClinicalSessionRepeatEndMode;
  endDate?: Date;
  count?: number;
}

export interface ClinicalSessionCancellationReason extends CaseEventReason {
  id: number;
  label: string;
  parentId?: number;
  active: boolean;
  sortOrder: number;
  children?: ClinicalSessionCancellationReason[];
}
