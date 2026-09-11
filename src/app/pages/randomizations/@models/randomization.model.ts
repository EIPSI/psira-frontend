import {
  RandomizationRule,
  RandomizationRuleType,
  RandomizationRuleTypeLabel,
} from '../@types/randomization';

export class RandomizationRuleModel {
  public static fromJson(json: RandomizationRule): RandomizationRule {
    return {
      ...json,
      departmentNames: (json.departments || []).map((department) => department.name).join(', '),
      itemCount: Array.isArray(json.items) ? json.items.length : json.itemCount || 0,
      formattedType: {
        color: json.type === RandomizationRuleType.LOW_LEVEL ? 'geekblue' : 'purple',
        title: RandomizationRuleTypeLabel[json.type] || json.type,
      },
      formattedStatus: {
        color: json.active ? 'green' : 'default',
        title: json.active ? 'Activa' : 'Inactiva',
      },
    };
  }
}
