export enum EvaluationAutomationTriggerPoint {
  USER_CREATED = 'USER_CREATED',
  FIRST_LOGIN = 'FIRST_LOGIN',
}

export enum EvaluationAutomationType {
  FIXED_SCHEME = 'FIXED_SCHEME',
  INDIVIDUAL_EVALUATION = 'INDIVIDUAL_EVALUATION',
}

export enum EvaluationAutomationDelayUnit {
  DAYS = 'DAYS',
  MINUTES = 'MINUTES',
}

export enum EvaluationAutomationConditionOperator {
  EQ = 'EQ',
  NEQ = 'NEQ',
  GT = 'GT',
  GTE = 'GTE',
  LT = 'LT',
  LTE = 'LTE',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  IS_EMPTY = 'IS_EMPTY',
  IS_NOT_EMPTY = 'IS_NOT_EMPTY',
  BOOLEAN = 'BOOLEAN',
}

export enum EvaluationAutomationContentType {
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  QUESTIONNAIRE_BUNDLE = 'QUESTIONNAIRE_BUNDLE',
  RANDOMIZATION = 'RANDOMIZATION',
}

export const EvaluationAutomationTriggerPointLabel: Record<EvaluationAutomationTriggerPoint, string> = {
  [EvaluationAutomationTriggerPoint.USER_CREATED]: 'Creación de usuario',
  [EvaluationAutomationTriggerPoint.FIRST_LOGIN]: 'Primer logueo',
};

export const EvaluationAutomationTypeLabel: Record<EvaluationAutomationType, string> = {
  [EvaluationAutomationType.FIXED_SCHEME]: 'Esquema fijo',
  [EvaluationAutomationType.INDIVIDUAL_EVALUATION]: 'Evaluación individual',
};

export const EvaluationAutomationConditionOperatorLabel: Record<EvaluationAutomationConditionOperator, string> = {
  [EvaluationAutomationConditionOperator.EQ]: 'igual a',
  [EvaluationAutomationConditionOperator.NEQ]: 'distinto de',
  [EvaluationAutomationConditionOperator.GT]: 'mayor que',
  [EvaluationAutomationConditionOperator.GTE]: 'mayor o igual que',
  [EvaluationAutomationConditionOperator.LT]: 'menor que',
  [EvaluationAutomationConditionOperator.LTE]: 'menor o igual que',
  [EvaluationAutomationConditionOperator.CONTAINS]: 'contiene',
  [EvaluationAutomationConditionOperator.NOT_CONTAINS]: 'no contiene',
  [EvaluationAutomationConditionOperator.IS_EMPTY]: 'está vacío',
  [EvaluationAutomationConditionOperator.IS_NOT_EMPTY]: 'no está vacío',
  [EvaluationAutomationConditionOperator.BOOLEAN]: 'verdadero/falso',
};

export interface EvaluationAutomationCondition {
  field: string;
  operator: EvaluationAutomationConditionOperator;
  value?: string;
}

export interface EvaluationAutomation {
  id: number;
  title: string;
  description?: string;
  active: boolean;
  triggerPoint: EvaluationAutomationTriggerPoint;
  automationType: EvaluationAutomationType;
  delayAmount: number;
  delayUnit: EvaluationAutomationDelayUnit;
  priority: number;
  conditions?: EvaluationAutomationCondition[];
  evaluationName?: string;
  schemeId?: number;
  assessmentTypeId?: number;
  questionnaireIds?: string[];
  questionnaireBundleIds?: string[];
  randomizationRuleIds?: number[];
  expirationMinutes?: number;
  reminderMinutes?: number[];
  emailNotificationsEnabled?: boolean;
  mailTemplateId?: number;
  createdAt?: string;
  updatedAt?: string;
  departments?: Array<{ id: number; name: string }>;
  role?: { id: number; name: string; code?: string };
  scheme?: { id: number; name: string };
  assessmentType?: { id: number; name: string };
  formattedStatus?: { color: string; title: string };
  formattedTriggerPoint?: { color: string; title: string };
  formattedAutomationType?: { color: string; title: string };
  departmentNames?: string;
  roleName?: string;
  resourceName?: string;
  delayLabel?: string;
}
