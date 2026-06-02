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

    return {
      ...json,
      departmentNames: (json.departments || []).map((department) => department.name).join(', '),
      roleName: json.role?.name || json.role?.code || '-',
      resourceName,
      delayLabel: `${json.delayAmount || 0} ${json.delayUnit === 'DAYS' ? 'día(s)' : 'minuto(s)'}`,
      formattedStatus: {
        color: json.active ? 'green' : 'default',
        title: json.active ? 'Activa' : 'Inactiva',
      },
      formattedTriggerPoint: {
        color: json.triggerPoint === EvaluationAutomationTriggerPoint.USER_CREATED ? 'blue' : 'cyan',
        title: EvaluationAutomationTriggerPointLabel[json.triggerPoint] || json.triggerPoint,
      },
      formattedAutomationType: {
        color: json.automationType === EvaluationAutomationType.FIXED_SCHEME ? 'purple' : 'geekblue',
        title: EvaluationAutomationTypeLabel[json.automationType] || json.automationType,
      },
    };
  }
}
