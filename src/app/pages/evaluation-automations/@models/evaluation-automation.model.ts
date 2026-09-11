import {
  EvaluationAutomation,
  EvaluationAutomationTriggerPoint,
  EvaluationAutomationTriggerPointLabel,
  EvaluationAutomationType,
  EvaluationAutomationTypeLabel,
} from '../@types/evaluation-automation';

export class EvaluationAutomationModel {
  public static fromJson(json: EvaluationAutomation): EvaluationAutomation {
    const resourceName =
      json.automationType === EvaluationAutomationType.FIXED_SCHEME
        ? json.scheme?.name || (json.schemeId ? `Esquema #${json.schemeId}` : '-')
        : json.evaluationName || json.assessmentType?.name || '-';

    const delayUnitLabel: Record<string, string> = {
      MINUTES: 'minuto(s)',
      HOURS: 'hora(s)',
      DAYS: 'día(s)',
      WEEKS: 'semana(s)',
      MONTHS: 'mes(es)',
      YEARS: 'año(s)',
    };
    const triggerColor: Record<string, string> = {
      [EvaluationAutomationTriggerPoint.USER_CREATED]: 'blue',
      [EvaluationAutomationTriggerPoint.FIRST_LOGIN]: 'cyan',
      [EvaluationAutomationTriggerPoint.LAST_LOGIN]: 'cyan',
      [EvaluationAutomationTriggerPoint.SESSION_NUMBER]: 'green',
      [EvaluationAutomationTriggerPoint.TREATMENT_FINALIZATION]: 'volcano',
      [EvaluationAutomationTriggerPoint.SESSION_NO_SHOW_CANCELLATION]: 'orange',
      [EvaluationAutomationTriggerPoint.NEW_TREATMENT]: 'purple',
    };

    return {
      ...json,
      departmentNames: (json.departments || []).map((department) => department.name).join(', '),
      roleName: json.role?.name || json.role?.code || '-',
      resourceName,
      delayLabel: `${json.delayAmount || 0} ${delayUnitLabel[json.delayUnit] || json.delayUnit}`,
      formattedStatus: {
        color: json.active ? 'green' : 'default',
        title: json.active ? 'Activa' : 'Inactiva',
      },
      formattedTriggerPoint: {
        color: triggerColor[json.triggerPoint] || 'default',
        title: EvaluationAutomationTriggerPointLabel[json.triggerPoint] || json.triggerPoint,
      },
      formattedAutomationType: {
        color: json.automationType === EvaluationAutomationType.FIXED_SCHEME ? 'purple' : 'geekblue',
        title: EvaluationAutomationTypeLabel[json.automationType] || json.automationType,
      },
    };
  }
}
