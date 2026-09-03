import { FormattedScript, Scripts } from '../@types/scripts';
import { formatSystemDate } from '@shared/utils/system-settings.util';

export class ScriptsModel {
  public static fromJson(json: FormattedScript): Scripts {
    const data = { ...json };
    data.formattedReports = data.reports.map((report) => ({ color: 'red', title: report.name }));
    data.createdAt = formatSystemDate(data.createdAt);
    return data;
  }
}
