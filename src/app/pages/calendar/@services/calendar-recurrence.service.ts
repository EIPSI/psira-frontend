import { Injectable } from '@angular/core';
import { addDays, addMonths, addWeeks, addYears, endOfDay, startOfWeek } from 'date-fns';

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
    return this.buildStarts(config).map((startAt) => ({
      startAt,
      endAt: new Date(startAt.getTime() + duration),
    }));
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
    const until = config.endMode === RepeatEndMode.ON_DATE && config.endDate ? endOfDay(config.endDate) : undefined;

    if (config.unit === RepeatUnit.WEEK && config.repeatOnDays.length) {
      for (let weekIndex = 0; starts.length < maxCount; weekIndex += every) {
        const weekStart = startOfWeek(addWeeks(config.startAt, weekIndex));
        for (const day of config.repeatOnDays) {
          const candidate = this.copyTime(addDays(weekStart, day), config.startAt);
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
    if (unit === RepeatUnit.DAY) return addDays(date, amount);
    if (unit === RepeatUnit.MONTH) return addMonths(date, amount);
    if (unit === RepeatUnit.YEAR) return addYears(date, amount);
    return addWeeks(date, amount);
  }

  private copyTime(date: Date, source: Date): Date {
    const copied = new Date(date);
    copied.setHours(source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds());
    return copied;
  }
}
