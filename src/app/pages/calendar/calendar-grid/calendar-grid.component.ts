import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import {
  CalendarEvent,
  CalendarEventType,
  CalendarView,
  ClinicalSessionCancellationType,
} from '../@types/calendar';
import { formatSystemDateTime, formatSystemTime, configuredMoment } from '@shared/utils/system-settings.util';

@Component({
  selector: 'app-calendar-grid',
  templateUrl: './calendar-grid.component.html',
  styleUrls: ['./calendar-grid.component.scss'],
})
export class CalendarGridComponent implements OnInit, OnDestroy {
  CV = CalendarView;
  today = new Date();
  private draggingEvent = false;
  private suppressActivationUntil = 0;
  private pointerDragCandidate?: CalendarEvent;
  private pointerDraggedEvent?: CalendarEvent;
  private pointerDragStart?: { x: number; y: number };
  private suppressNativeContextMenuUntil = 0;
  private readonly nativeContextMenuHandler = (event: MouseEvent) => this.preventNativeCalendarContextMenu(event);
  dragPreviewEvent?: CalendarEvent;
  dragPreviewX = 0;
  dragPreviewY = 0;

  @Input() events: CalendarEvent[] = [];
  @Input() loading = false;
  @Input() selectedDate = new Date();
  @Input() view = CalendarView.MONTH;

  @Output() selectedDateChange = new EventEmitter<Date>();
  @Output() viewChange = new EventEmitter<CalendarView>();
  @Output() rangeChange = new EventEmitter<void>();
  @Output() createEvent = new EventEmitter<{ date: Date; hour?: number }>();
  @Output() eventClick = new EventEmitter<CalendarEvent>();
  @Output() eventContextMenu = new EventEmitter<{ event: MouseEvent; calendarEvent: CalendarEvent }>();
  @Output() eventDragStart = new EventEmitter<{ event: DragEvent; calendarEvent: CalendarEvent }>();
  @Output() eventDrop = new EventEmitter<{ event: DragEvent; date: Date; hour?: number }>();
  @Output() eventDragOver = new EventEmitter<DragEvent>();

  ngOnInit(): void {
    window.addEventListener('contextmenu', this.nativeContextMenuHandler, true);
    document.addEventListener('contextmenu', this.nativeContextMenuHandler, true);
  }

  ngOnDestroy(): void {
    window.removeEventListener('contextmenu', this.nativeContextMenuHandler, true);
    document.removeEventListener('contextmenu', this.nativeContextMenuHandler, true);
  }

  get title(): string {
    if (this.view === CalendarView.DAY) return configuredMoment(this.selectedDate).format('dddd D MMMM YYYY');
    if (this.view === CalendarView.WEEK) {
      return `${configuredMoment(startOfWeek(this.selectedDate)).format('D MMM')} - ${configuredMoment(endOfWeek(this.selectedDate)).format('D MMM YYYY')}`;
    }
    return configuredMoment(this.selectedDate).format('MMMM YYYY');
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
    const classes = [
      event.type === CalendarEventType.SESSION ? 'calendar-event--session' : 'calendar-event--assessment',
    ];
    if (
      event.type === CalendarEventType.SESSION &&
      event.cancellationType === ClinicalSessionCancellationType.NO_SHOW
    ) {
      classes.push('calendar-event--no-show');
    }
    return classes.join(' ');
  }

  formatTime(value: string): string {
    return formatSystemTime(value);
  }

  formatWeekday(value: Date, long = false): string {
    return configuredMoment(value).format(long ? 'dddd' : 'ddd');
  }

  formatDay(value: Date): string {
    return configuredMoment(value).format('D');
  }

  isToday(value: Date): boolean {
    return isSameDay(value, this.today);
  }

  formatDateTime(value: string): string {
    return formatSystemDateTime(value);
  }

  isMutedMonthDay(date: Date): boolean {
    return !isSameMonth(date, this.selectedDate);
  }

  onCellClick(domEvent: MouseEvent, date: Date, hour?: number): void {
    domEvent.preventDefault();
    this.openCreateEvent(date, hour);
  }

  onCellMouseUp(domEvent: MouseEvent, date: Date, hour?: number): void {
    if (domEvent.button !== 0) return;
    if (this.eventFromTarget(domEvent.target)) return;

    if (this.pointerDraggedEvent) {
      domEvent.preventDefault();
      domEvent.stopPropagation();
      const draggedEvent = this.pointerDraggedEvent;
      this.eventDragStart.emit({ event: domEvent as any, calendarEvent: draggedEvent });
      this.finishDrag();
      this.eventDrop.emit({ event: domEvent as any, date, hour });
      return;
    }

    if (Date.now() < this.suppressActivationUntil) return;
    domEvent.preventDefault();
    domEvent.stopPropagation();
    this.openCreateEvent(date, hour);
  }

  onEventClick(domEvent: MouseEvent, event: CalendarEvent): void {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    this.clearPointerDragCandidate();
    this.clearNativeSelection(domEvent);
    this.eventClick.emit(event);
  }

  onEventNativeClick(domEvent: MouseEvent): void {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    this.clearPointerDragCandidate();
    this.clearNativeSelection(domEvent);
  }

  onEventMouseDown(domEvent: MouseEvent, event: CalendarEvent): void {
    domEvent.stopPropagation();
    if (domEvent.button === 2) {
      domEvent.preventDefault();
      this.suppressNativeContextMenuUntil = Date.now() + 900;
      this.openEventContextMenu(domEvent, event);
      return;
    }
    if (domEvent.button !== 0) return;
    this.pointerDragCandidate = event;
    this.pointerDragStart = { x: domEvent.clientX, y: domEvent.clientY };
    this.dragPreviewX = domEvent.clientX;
    this.dragPreviewY = domEvent.clientY;
  }

  onEventDragStart(domEvent: DragEvent, event: CalendarEvent): void {
    domEvent.stopPropagation();
    this.draggingEvent = true;
    this.pointerDraggedEvent = event;
    this.dragPreviewEvent = event;
    if (domEvent.dataTransfer) {
      const ghost = document.createElement('div');
      ghost.style.width = '1px';
      ghost.style.height = '1px';
      ghost.style.opacity = '0';
      document.body.appendChild(ghost);
      domEvent.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => document.body.removeChild(ghost), 0);
    }
    this.eventDragStart.emit({ event: domEvent, calendarEvent: event });
  }

  onEventDragEnd(): void {
    this.finishDrag();
  }

  onDragOver(domEvent: DragEvent): void {
    domEvent.preventDefault();
    this.dragPreviewX = domEvent.clientX;
    this.dragPreviewY = domEvent.clientY;
    this.eventDragOver.emit(domEvent);
  }

  onDrop(domEvent: DragEvent, date: Date, hour?: number): void {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    this.finishDrag();
    this.eventDrop.emit({ event: domEvent, date, hour });
  }

  onCellContextMenu(domEvent: MouseEvent): void {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    const event = this.eventFromTarget(domEvent.target);
    if (!event) return;
    this.openEventContextMenu(domEvent, event);
  }

  private updateSelectedDate(date: Date): void {
    this.selectedDate = date;
    this.selectedDateChange.emit(date);
    this.rangeChange.emit();
  }

  onEventMouseUp(domEvent: MouseEvent, event: CalendarEvent): void {
    if (domEvent.button !== 0) return;
    if (this.draggingEvent || this.pointerDraggedEvent || Date.now() < this.suppressActivationUntil) {
      domEvent.preventDefault();
      domEvent.stopPropagation();
      this.finishDrag();
      return;
    }
    this.onEventClick(domEvent, event);
  }

  private finishDrag(): void {
    this.draggingEvent = false;
    this.clearPointerDragCandidate();
    this.dragPreviewEvent = undefined;
    this.suppressActivationUntil = Date.now() + 250;
  }

  private clearPointerDragCandidate(): void {
    this.pointerDragCandidate = undefined;
    this.pointerDraggedEvent = undefined;
    this.pointerDragStart = undefined;
  }

  private clearNativeSelection(domEvent?: MouseEvent): void {
    const element = domEvent?.currentTarget as HTMLElement | undefined;
    element?.blur?.();
    window.getSelection?.()?.removeAllRanges?.();
  }

  onEventContextMenu(domEvent: MouseEvent, event: CalendarEvent): void {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    this.openEventContextMenu(domEvent, event);
  }

  private openEventContextMenu(domEvent: MouseEvent, event: CalendarEvent): void {
    this.clearPointerDragCandidate();
    this.clearNativeSelection(domEvent);
    this.eventContextMenu.emit({ event: domEvent, calendarEvent: event });
  }

  private preventNativeCalendarContextMenu(domEvent: MouseEvent): void {
    const target = domEvent.target as HTMLElement | null;
    const isRecentPsiraContextMenu = Date.now() < this.suppressNativeContextMenuUntil;
    const isCalendarContextMenu = !!target?.closest?.('.calendar-shell');
    if (!isRecentPsiraContextMenu && !isCalendarContextMenu) return;

    domEvent.preventDefault();
    domEvent.stopPropagation();
    domEvent.stopImmediatePropagation();
  }

  private eventFromTarget(target: EventTarget | null): CalendarEvent | undefined {
    const element = (target as HTMLElement)?.closest?.('.calendar-event') as HTMLElement | null;
    const eventId = element?.dataset?.eventId;
    return eventId ? this.events.find((event) => event.id === eventId) : undefined;
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(domEvent: MouseEvent): void {
    this.dragPreviewX = domEvent.clientX;
    this.dragPreviewY = domEvent.clientY;
    if (!this.pointerDragCandidate || !this.pointerDragStart) return;
    const distanceX = Math.abs(domEvent.clientX - this.pointerDragStart.x);
    const distanceY = Math.abs(domEvent.clientY - this.pointerDragStart.y);
    if (distanceX < 6 && distanceY < 6) return;
    this.pointerDraggedEvent = this.pointerDragCandidate;
    this.draggingEvent = true;
    this.dragPreviewEvent = this.pointerDragCandidate;
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    if (!this.pointerDraggedEvent && this.pointerDragCandidate) {
      this.clearPointerDragCandidate();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(domEvent: MouseEvent): void {
    const target = domEvent.target as HTMLElement | null;
    if (!target?.closest?.('.calendar-shell')) return;

    domEvent.preventDefault();
    domEvent.stopPropagation();

    const event = this.eventFromTarget(domEvent.target);
    if (event) {
      this.openEventContextMenu(domEvent, event);
    }
  }
}
