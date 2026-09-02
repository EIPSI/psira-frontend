export enum InformedConsentKind {
  TERMS_OF_USE = 'TERMS_OF_USE',
  TREATMENT = 'TREATMENT',
  RESEARCH = 'RESEARCH',
}

export enum InformedConsentVersionStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum InformedConsentManagementStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

export enum InformedConsentTrigger {
  USER_CREATED = 'USER_CREATED',
  FIRST_LOGIN = 'FIRST_LOGIN',
  NEW_TREATMENT = 'NEW_TREATMENT',
  CONSENT_VERSION_CHANGED = 'CONSENT_VERSION_CHANGED',
}

export enum InformedConsentQuestionType {
  CHECKBOX = 'CHECKBOX',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  SHORT_TEXT = 'SHORT_TEXT',
  LONG_TEXT = 'LONG_TEXT',
  DATE = 'DATE',
}

export enum InformedConsentAnswerResolution {
  ACCEPTS = 'ACCEPTS',
  REJECTS = 'REJECTS',
  REQUIRES_REVIEW = 'REQUIRES_REVIEW',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export enum InformedConsentResponseStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  BLOCKED = 'BLOCKED',
  REACTIVATED = 'REACTIVATED',
  REVOKED = 'REVOKED',
}

export const InformedConsentKindLabel = {
  [InformedConsentKind.TERMS_OF_USE]: 'Condiciones de uso',
  [InformedConsentKind.TREATMENT]: 'Tratamiento',
  [InformedConsentKind.RESEARCH]: 'Investigación',
};

export const InformedConsentTriggerLabel = {
  [InformedConsentTrigger.USER_CREATED]: 'Creación de usuario',
  [InformedConsentTrigger.FIRST_LOGIN]: 'Primer login',
  [InformedConsentTrigger.NEW_TREATMENT]: 'Nuevo tratamiento/supervisión',
  [InformedConsentTrigger.CONSENT_VERSION_CHANGED]: 'Cambio de versión',
};

export const InformedConsentStatusLabel = {
  [InformedConsentManagementStatus.DRAFT]: 'Borrador',
  [InformedConsentManagementStatus.ACTIVE]: 'Activa',
  [InformedConsentManagementStatus.PAUSED]: 'Pausada',
  [InformedConsentManagementStatus.ARCHIVED]: 'Archivada',
};

export interface InformedConsentTextBlock {
  id?: number;
  orderIndex: number;
  title?: string;
  content: string;
}

export interface InformedConsentAnswerOption {
  id?: number;
  orderIndex: number;
  value: string;
  label: string;
  resolution: InformedConsentAnswerResolution;
  blocksUsageOnSelection?: boolean;
}

export interface InformedConsentQuestion {
  id?: number;
  kind: InformedConsentKind;
  kinds?: InformedConsentKind[];
  questionType: InformedConsentQuestionType;
  orderIndex: number;
  label: string;
  helpText?: string;
  required?: boolean;
  answerOptions?: InformedConsentAnswerOption[];
}

export interface InformedConsentVersion {
  id: number;
  versionNumber: number;
  title: string;
  status: InformedConsentVersionStatus;
  submitButtonLabel?: string;
  thankYouHtml?: string;
  notes?: string;
  publishedAt?: string;
  textBlocks?: InformedConsentTextBlock[];
  questions?: InformedConsentQuestion[];
}

export interface InformedConsentModel {
  id: number;
  name: string;
  kind: InformedConsentKind;
  description?: string;
  active: boolean;
  systemDefault: boolean;
  currentPublishedVersionId?: number;
  currentPublishedVersion?: InformedConsentVersion;
  departments?: Array<{ id: number; name: string }>;
  versions?: InformedConsentVersion[];
}

export interface InformedConsentManagement {
  id: number;
  title: string;
  description?: string;
  modelId: number;
  status: InformedConsentManagementStatus;
  trigger: InformedConsentTrigger;
  mandatory: boolean;
  appliesToAllDepartments: boolean;
  appliesToAllRoles: boolean;
  priority: number;
  active: boolean;
  model?: InformedConsentModel;
  departments?: Array<{ id: number; name: string }>;
  roles?: Array<{ id: number; name: string; code?: string }>;
}

export interface PendingInformedConsent {
  managementId: number;
  modelId: number;
  versionId: number;
  title: string;
  kind: InformedConsentKind;
  trigger: InformedConsentTrigger;
  mandatory: boolean;
  blocking: boolean;
  responseId?: number;
  responseStatus?: InformedConsentResponseStatus;
}

export interface InformedConsentResponse {
  id: number;
  managementId?: number;
  modelId: number;
  versionId: number;
  signerUserId: number;
  representedUserId?: number;
  patientId?: number;
  status: InformedConsentResponseStatus;
  finalResolution?: InformedConsentAnswerResolution;
  mandatorySnapshot: boolean;
  answeredAt?: string;
  blockedAt?: string;
  createdAt?: string;
  model?: InformedConsentModel;
  management?: InformedConsentManagement;
  version?: InformedConsentVersion;
  answers?: Array<{
    id: number;
    questionId: number;
    answerOptionId?: number;
    valueText?: string;
    resolution?: InformedConsentAnswerResolution;
    answerOption?: InformedConsentAnswerOption;
  }>;
  signer?: { id: number; firstName: string; lastName: string; email?: string; username?: string };
  representedUser?: { id: number; firstName: string; lastName: string; email?: string; username?: string };
  patient?: { id: number; firstName: string; lastName: string; medicalRecordNo?: string };
}

export interface InformedConsentShortcut {
  group: string;
  label: string;
  token: string;
  description: string;
}
