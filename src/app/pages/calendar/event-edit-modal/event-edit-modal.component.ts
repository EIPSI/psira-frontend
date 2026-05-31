import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CalendarEvent } from '../@types/calendar';

@Component({
  selector: 'app-event-edit-modal',
  templateUrl: './event-edit-modal.component.html',
  styleUrls: ['./event-edit-modal.component.scss'],
})
export class EventEditModalComponent {
  @Input() visible = false;
  @Input() saving = false;
  @Input() event?: CalendarEvent;
  @Input() startAt?: Date;
  @Input() endAt?: Date;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() startAtChange = new EventEmitter<Date>();
  @Output() endAtChange = new EventEmitter<Date>();
  @Output() save = new EventEmitter<void>();
  @Output() discard = new EventEmitter<CalendarEvent>();
  @Output() durationChange = new EventEmitter<number>();

  close(): void {
    this.visibleChange.emit(false);
  }

  discardEvent(): void {
    if (!this.event) return;
    this.discard.emit(this.event);
  }
}
