export enum EvaluationSchemeType {
  SESSION_BASED = 'SESSION_BASED',
  INDEPENDENT_EVALUATION = 'INDEPENDENT_EVALUATION',
}

export const EvaluationSchemeTypeLabel: Record<EvaluationSchemeType, string> = {
  [EvaluationSchemeType.SESSION_BASED]: 'Session based',
  [EvaluationSchemeType.INDEPENDENT_EVALUATION]: 'Esquema fijo',
};

export interface EvaluationScheme {
  id: number;
  name: string;
  description?: string;
  schemeType: EvaluationSchemeType;
  defaultRecurrenceRule?: string;
  defaultDurationMinutes: number;
  durationDays?: number;
  active: boolean;
  emailNotificationsEnabled?: boolean;
  mailTemplateId?: number;
  departments?: Array<{ id: number; name: string }>;
  createdAt?: string;
  updatedAt?: string;
  sessionTemplates?: any[];
  independentEvaluationTemplates?: any[];
  formattedSchemeType?: { color: string; title: string };
  formattedStatus?: { color: string; title: string };
}

export enum ClinicalSessionKind {
  CLINICAL = 'CLINICAL',
  SUPERVISION = 'SUPERVISION',
}

export enum ClinicalSessionResourceKind {
  PRE_ASSESSMENT = 'PRE_ASSESSMENT',
  POST_ASSESSMENT = 'POST_ASSESSMENT',
  CLINICAL_NOTES = 'CLINICAL_NOTES',
  FOLLOW_UP = 'FOLLOW_UP',
}

export enum ResourceActivationAnchor {
  SESSION_START = 'SESSION_START',
  SESSION_END = 'SESSION_END',
}

export interface ApplyEvaluationSchemeInput {
  schemeId?: number;
  randomizationRuleId?: number;
  patientId?: number;
  targetUserId?: number;
  therapistId?: number;
  supervisorId?: number;
  responderUserId?: number;
  clinicianId?: number;
  startDate: Date;
  timezone?: string;
  maxFutureOccurrences?: number;
  futureGenerationMonths?: number;
}
