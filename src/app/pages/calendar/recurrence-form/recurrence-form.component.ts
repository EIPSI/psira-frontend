import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RepeatEndMode, RepeatOption, RepeatUnit } from '../@services/calendar-recurrence.service';

@Component({
  selector: 'app-recurrence-form',
  templateUrl: './recurrence-form.component.html',
  styleUrls: ['./recurrence-form.component.scss'],
})
export class RecurrenceFormComponent {
  RU = RepeatUnit;
  RE = RepeatEndMode;

  @Input() enabled = false;
  @Input() every = 1;
  @Input() unit = RepeatUnit.WEEK;
  @Input() repeatOnDays: number[] = [];
  @Input() endMode = RepeatEndMode.AFTER_COUNT;
  @Input() endDate?: Date;
  @Input() count = 12;
  @Input() repeatUnits: RepeatOption<RepeatUnit>[] = [];
  @Input() weekDayOptions: RepeatOption<number>[] = [];

  @Output() enabledChange = new EventEmitter<boolean>();
  @Output() everyChange = new EventEmitter<number>();
  @Output() unitChange = new EventEmitter<RepeatUnit>();
  @Output() repeatOnDaysChange = new EventEmitter<number[]>();
  @Output() endModeChange = new EventEmitter<RepeatEndMode>();
  @Output() endDateChange = new EventEmitter<Date | undefined>();
  @Output() countChange = new EventEmitter<number>();

  isRepeatDaySelected(day: number): boolean {
    return this.repeatOnDays.includes(day);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.enabledChange.emit(enabled);
  }

  setEvery(every: number): void {
    this.every = every;
    this.everyChange.emit(every);
  }

  setUnit(unit: RepeatUnit): void {
    this.unit = unit;
    this.unitChange.emit(unit);
  }

  setEndMode(endMode: RepeatEndMode): void {
    this.endMode = endMode;
    this.endModeChange.emit(endMode);
  }

  setEndDate(endDate?: Date): void {
    this.endDate = endDate;
    this.endDateChange.emit(endDate);
  }

  setCount(count: number): void {
    this.count = count;
    this.countChange.emit(count);
  }

  toggleRepeatDay(day: number): void {
    this.repeatOnDays = this.isRepeatDaySelected(day)
      ? this.repeatOnDays.filter((selectedDay) => selectedDay !== day)
      : [...this.repeatOnDays, day].sort();
    this.repeatOnDaysChange.emit(this.repeatOnDays);
  }
}
