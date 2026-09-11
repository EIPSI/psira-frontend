import { Injectable } from '@angular/core';
import { CalendarEvent } from '../@types/calendar';

@Injectable({
  providedIn: 'root',
})
export class CalendarEventUiService {
  setDragData(event: DragEvent, calendarEvent: CalendarEvent): void {
    event.dataTransfer?.setData('text/plain', calendarEvent.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  droppedWindow(calendarEvent: CalendarEvent, date: Date, hour?: number): { startAt: Date; endAt: Date } {
    const originalStart = new Date(calendarEvent.startAt);
    const originalEnd = new Date(calendarEvent.endAt);
    const duration = originalEnd.getTime() - originalStart.getTime();
    const startAt = new Date(date);
    startAt.setHours(hour ?? originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    return {
      startAt,
      endAt: new Date(startAt.getTime() + duration),
    };
  }

  endFromDuration(startAt: Date, minutes: number): Date {
    return new Date(startAt.getTime() + minutes * 60000);
  }
}
