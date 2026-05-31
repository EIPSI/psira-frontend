import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { CalendarEvent, CalendarEventType, CalendarView } from '../@types/calendar';

@Component({
  selector: 'app-calendar-grid',
  templateUrl: './calendar-grid.component.html',
  styleUrls: ['./calendar-grid.component.scss'],
})
export class CalendarGridComponent {
  CV = CalendarView;
  today = new Date();

  @Input() events: CalendarEvent[] = [];
  @Input() loading = false;
  @Input() selectedDate = new Date();
  @Input() view = CalendarView.MONTH;

  @Output() selectedDateChange = new EventEmitter<Date>();
  @Output() viewChange = new EventEmitter<CalendarView>();
  @Output() rangeChange = new EventEmitter<void>();
  @Output() createEvent = new EventEmitter<{ date: Date; hour?: number }>();
  @Output() eventClick = new EventEmitter<CalendarEvent>();
  @Output() eventDragStart = new EventEmitter<{ event: DragEvent; calendarEvent: CalendarEvent }>();
  @Output() eventDrop = new EventEmitter<{ event: DragEvent; date: Date; hour?: number }>();
  @Output() eventDragOver = new EventEmitter<DragEvent>();

  get title(): string {
    if (this.view === CalendarView.DAY) return format(this.selectedDate, 'EEEE d MMMM yyyy');
    if (this.view === CalendarView.WEEK) {
      return `${format(startOfWeek(this.selectedDate), 'd MMM')} - ${format(endOfWeek(this.selectedDate), 'd MMM yyyy')}`;
    }
    return format(this.selectedDate, 'MMMM yyyy');
  }

  get monthDays(): Date[] {
    const start = startOfWeek(startOfMonth(this.selectedDate));
    const end = endOfWeek(endOfMonth(this.selectedDate));
    const days: Date[] = [];
    for (let date = start; date <= end; date = addDays(date, 1)) days.push(date);
    return days;
  }

  get weekDays(): Date[] {
    const start = startOfWeek(this.selectedDate);
    return Array.from({ length: 7 }).map((_, index) => addDays(start, index));
  }

  get hourSlots(): number[] {
    return Array.from({ length: 15 }).map((_, index) => index + 7);
  }

  previousPeriod(): void {
    if (this.view === CalendarView.DAY) this.updateSelectedDate(subDays(this.selectedDate, 1));
    if (this.view === CalendarView.WEEK) this.updateSelectedDate(subWeeks(this.selectedDate, 1));
    if (this.view === CalendarView.MONTH) this.updateSelectedDate(subMonths(this.selectedDate, 1));
  }

  nextPeriod(): void {
    if (this.view === CalendarView.DAY) this.updateSelectedDate(addDays(this.selectedDate, 1));
    if (this.view === CalendarView.WEEK) this.updateSelectedDate(addWeeks(this.selectedDate, 1));
    if (this.view === CalendarView.MONTH) this.updateSelectedDate(addMonths(this.selectedDate, 1));
  }

  goToday(): void {
    this.updateSelectedDate(new Date());
  }

  setView(view: CalendarView): void {
    this.view = view;
    this.viewChange.emit(view);
    this.rangeChange.emit();
  }

  openCreateEvent(date: Date = this.selectedDate, hour?: number): void {
    this.createEvent.emit({ date, hour });
  }

  eventsForDate(date: Date): CalendarEvent[] {
    return this.events.filter((event) => isSameDay(new Date(event.startAt), date));
  }

  eventsForHour(date: Date, hour: number): CalendarEvent[] {
    return this.eventsForDate(date).filter((event) => new Date(event.startAt).getHours() === hour);
  }

  eventClass(event: CalendarEvent): string {
    return event.type === CalendarEventType.SESSION ? 'calendar-event--session' : 'calendar-event--assessment';
  }

  formatTime(value: string): string {
    return format(new Date(value), 'HH:mm');
  }

  isMutedMonthDay(date: Date): boolean {
    return !isSameMonth(date, this.selectedDate);
  }

  onEventClick(domEvent: MouseEvent, event: CalendarEvent): void {
    domEvent.stopPropagation();
    this.eventClick.emit(event);
  }

  private updateSelectedDate(date: Date): void {
    this.selectedDate = date;
    this.selectedDateChange.emit(date);
    this.rangeChange.emit();
  }
}
