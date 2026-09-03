import { formatSystemDate, formatSystemDateTime, formatSystemTime } from '@shared/utils/system-settings.util';

export class AppDate {
  public static formatDate(date: string): string {
    return formatSystemDate(date);
  }

  public static formatTime(date: string): string {
    return formatSystemTime(date);
  }

  public static formatDateTime(date: string): string {
    return formatSystemDateTime(date);
  }
}
