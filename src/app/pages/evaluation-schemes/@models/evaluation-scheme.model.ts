import {
  EvaluationScheme,
  EvaluationSchemeType,
  EvaluationSchemeTypeLabel,
} from '../@types/evaluation-scheme';

export class EvaluationSchemeModel {
  public static fromJson(json: EvaluationScheme): EvaluationScheme {
    return {
      ...json,
      formattedSchemeType: {
        color: json.schemeType === EvaluationSchemeType.SESSION_BASED ? 'geekblue' : 'purple',
        title: EvaluationSchemeTypeLabel[json.schemeType] || json.schemeType,
      },
      formattedStatus: {
        color: json.active ? 'green' : 'default',
        title: json.active ? 'evaluationSchemes.active' : 'evaluationSchemes.inactive',
      },
    };
  }
}
