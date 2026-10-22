import { configuredMoment, fromUserDateInput } from '@shared/utils/system-settings.util';
import * as moment from 'moment-timezone';
import { Injectable } from '@angular/core';

export enum RepeatUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export enum RepeatEndMode {
  NEVER = 'NEVER',
  ON_DATE = 'ON_DATE',
  AFTER_COUNT = 'AFTER_COUNT',
}

export interface RepeatOption<T> {
  label: string;
  value: T;
}

export interface RecurrenceConfig {
  startAt: Date;
  endAt: Date;
  enabled: boolean;
  every: number;
  unit: RepeatUnit;
  repeatOnDays: number[];
  endMode: RepeatEndMode;
  endDate?: Date;
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarRecurrenceService {
  readonly repeatUnits: RepeatOption<RepeatUnit>[] = [
    { label: 'time.days', value: RepeatUnit.DAY },
    { label: 'time.weeks', value: RepeatUnit.WEEK },
    { label: 'time.months', value: RepeatUnit.MONTH },
    { label: 'time.years', value: RepeatUnit.YEAR },
  ];

  readonly weekDayOptions: RepeatOption<number>[] = [
    { label: 'calendar.weekdayShortSunday', value: 0 },
    { label: 'calendar.weekdayShortMonday', value: 1 },
    { label: 'calendar.weekdayShortTuesday', value: 2 },
    { label: 'calendar.weekdayShortWednesday', value: 3 },
    { label: 'calendar.weekdayShortThursday', value: 4 },
    { label: 'calendar.weekdayShortFriday', value: 5 },
    { label: 'calendar.weekdayShortSaturday', value: 6 },
  ];

  buildOccurrences(config: RecurrenceConfig): Array<{ startAt: Date; endAt: Date }> {
    if (!config.enabled) return [{ startAt: config.startAt, endAt: config.endAt }];

    const duration = config.endAt.getTime() - config.startAt.getTime();
    // Weekday choices are entered in the viewer's zone; recurrence arithmetic is UTC.
    const dayShift = config.startAt.getUTCDay() - configuredMoment(config.startAt).day();
    const utcConfig = {
      ...config,
      repeatOnDays: config.repeatOnDays.map((day) => (day + dayShift + 7) % 7).sort((a, b) => a - b),
    };
    return this.buildStarts(utcConfig).map((startAt) => ({ startAt, endAt: new Date(startAt.getTime() + duration) }));
  }

  private buildStarts(config: RecurrenceConfig): Date[] {
    const starts: Date[] = [];
    const every = Math.max(1, Number(config.every || 1));
    const maxCount =
      config.endMode === RepeatEndMode.AFTER_COUNT
        ? Math.max(1, Number(config.count || 1))
        : config.endMode === RepeatEndMode.ON_DATE
        ? 366
        : 12;
    const until =
      config.endMode === RepeatEndMode.ON_DATE && config.endDate
        ? fromUserDateInput(moment(config.endDate).endOf('day').toDate())
        : undefined;

    if (config.unit === RepeatUnit.WEEK && config.repeatOnDays.length) {
      for (let weekIndex = 0; starts.length < maxCount; weekIndex += every) {
        const weekStart = moment.utc(config.startAt).add(weekIndex, 'weeks').day(0).startOf('day').toDate();
        for (const day of config.repeatOnDays) {
          const candidate = this.copyTime(moment.utc(weekStart).add(day, 'days').toDate(), config.startAt);
          if (candidate.getTime() < config.startAt.getTime()) continue;
          if (until && candidate.getTime() > until.getTime()) return starts;
          starts.push(candidate);
          if (starts.length >= maxCount) break;
        }
        if (until && weekStart.getTime() > until.getTime()) break;
      }
      return starts;
    }

    for (let index = 0; starts.length < maxCount; index += 1) {
      const candidate = this.addRepeatPeriod(config.startAt, index * every, config.unit);
      if (until && candidate.getTime() > until.getTime()) break;
      starts.push(candidate);
    }
    return starts;
  }

  private addRepeatPeriod(date: Date, amount: number, unit: RepeatUnit): Date {
    if (unit === RepeatUnit.DAY) return moment.utc(date).add(amount, 'days').toDate();
    if (unit === RepeatUnit.MONTH) return moment.utc(date).add(amount, 'months').toDate();
    if (unit === RepeatUnit.YEAR) return moment.utc(date).add(amount, 'years').toDate();
    return moment.utc(date).add(amount, 'weeks').toDate();
  }

  private copyTime(date: Date, source: Date): Date {
    const copied = new Date(date);
    copied.setUTCHours(source.getUTCHours(), source.getUTCMinutes(), source.getUTCSeconds(), source.getUTCMilliseconds());
    return copied;
  }
}
