export enum RandomizationRuleType {
  LOW_LEVEL = 'LOW_LEVEL',
  HIGH_LEVEL = 'HIGH_LEVEL',
}

export enum RandomizationRuleItemType {
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  QUESTIONNAIRE_BUNDLE = 'QUESTIONNAIRE_BUNDLE',
  EVALUATION_SCHEME = 'EVALUATION_SCHEME',
}

export const RandomizationRuleTypeLabel: Record<RandomizationRuleType, string> = {
  [RandomizationRuleType.LOW_LEVEL]: 'Nivel Bajo',
  [RandomizationRuleType.HIGH_LEVEL]: 'Nivel Alto',
};

export interface RandomizationRuleItem {
  id: number;
  itemType: RandomizationRuleItemType;
  questionnaireId?: string;
  questionnaireBundleId?: string;
  evaluationSchemeId?: number;
  weight: number;
  position: number;
}

export interface RandomizationRule {
  id: number;
  name: string;
  type: RandomizationRuleType;
  active: boolean;
  itemCount?: number;
  departments?: Array<{ id: number; name: string }>;
  departmentNames?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: RandomizationRuleItem[];
  formattedType?: { color: string; title: string };
  formattedStatus?: { color: string; title: string };
}
