import { Injectable } from '@angular/core';
import { formatSystemDate, formatSystemDateTime, formatSystemTime } from '@shared/utils/system-settings.util';

@Injectable({
  providedIn: 'root',
})
export class DateService {
  public formatDate(date: string): string {
    return formatSystemDate(date);
  }

  public formatTime(date: string): string {
    return formatSystemTime(date);
  }

  public formatDateTime(date: string): string {
    return formatSystemDateTime(date);
  }
}
