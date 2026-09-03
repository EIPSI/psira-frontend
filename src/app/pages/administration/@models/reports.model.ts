import { FormattedReport, Reports } from '../@types/reports';
import { formatSystemDate } from '@shared/utils/system-settings.util';

export class ReportsModel {
  public static fromJson(json: FormattedReport): Reports {
    const data = { ...json };

    data.formattedRoles = data.roles.map((role) => ({ color: 'blue', title: role.name }));
    data.createdAt = formatSystemDate(data.createdAt);
    return data;
  }
}
