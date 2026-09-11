import { Pipe, PipeTransform } from '@angular/core';
import { formatSystemDate, formatSystemDateTime, formatSystemTime } from '@shared/utils/system-settings.util';

@Pipe({
  name: 'formatDate',
})
export class DatePipe implements PipeTransform {
  transform(date: any, args?: any): any {
    return formatSystemDate(date);
  }
}

@Pipe({
  name: 'formatDateTime',
})
export class DateTimePipe implements PipeTransform {
  transform(date: any): any {
    return formatSystemDateTime(date);
  }
}

@Pipe({
  name: 'formatTime',
})
export class TimePipe implements PipeTransform {
  transform(date: any): any {
    return formatSystemTime(date);
  }
}
