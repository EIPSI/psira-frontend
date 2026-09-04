import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { addMonths, endOfMonth, format, isSameDay, startOfMonth, subMonths } from 'date-fns';
import { finalize } from 'rxjs/operators';
import {
  CalendarOccurrence,
  CalendarOccurrenceFilter,
  CalendarOccurrenceType,
} from './@types/calendar';
import { CalendarService } from './@services/calendar.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { Patient } from '@app/pages/patients-management/@types/patient';
import { User } from '@app/pages/user-management/@types/user';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { PermissionKey } from '@shared/@types/permission';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnChanges, OnInit {
  @Input() patientId?: number;
  @Input() therapistId?: number;
  @Input() supervisorId?: number;
  @Output() contentChange = new EventEmitter<boolean>();

  occurrenceTypes = Object.values(CalendarOccurrenceType);
  selectedDate = new Date();
  occurrenceType?: CalendarOccurrenceType;
  loading = false;
  saving = false;
  occurrences: CalendarOccurrence[] = [];
  selectedPatient?: Patient;
  selectedTherapist?: User;
  selectedSupervisor?: User;
  detailOccurrence?: CalendarOccurrence;
  detailModalVisible = false;
  googleCalendarConfigured = false;
  private initialized = false;

  constructor(
    private calendarService: CalendarService,
    private errorService: ErrorHandlerService,
    private perms: AppPermissionsService
  ) {}

  ngOnInit(): void {
    this.initialized = true;
    this.loadOccurrences();
    this.loadGoogleCalendarStatus();
  }

  ngOnChanges(): void {
    if (this.initialized) {
      this.loadOccurrences();
    }
  }

  get monthLabel(): string {
    return format(this.selectedDate, 'MMMM yyyy');
  }

  previousMonth(): void {
    this.selectedDate = subMonths(this.selectedDate, 1);
    this.loadOccurrences();
  }

  nextMonth(): void {
    this.selectedDate = addMonths(this.selectedDate, 1);
    this.loadOccurrences();
  }

  onPanelDateChange(date: Date): void {
    this.selectedDate = date;
    this.loadOccurrences();
  }

  onTypeChange(type?: CalendarOccurrenceType): void {
    this.occurrenceType = type;
    this.loadOccurrences();
  }

  onFilterChange(): void {
    this.loadOccurrences();
  }

  connectGoogleCalendar(): void {
    this.calendarService.getGoogleCalendarAuthorizationUrl().subscribe(
      (url) => (window.location.href = url),
      (error) => this.errorService.handleError(error, { prefix: 'Unable to start Google Calendar connection' })
    );
  }

  eventsForDate(date: Date): CalendarOccurrence[] {
    return this.occurrences.filter((occurrence) => isSameDay(new Date(occurrence.startAt), date));
  }

  formatTime(value: string): string {
    return format(new Date(value), 'HH:mm');
  }

  personName(person?: { firstName?: string; middleName?: string; lastName?: string }): string {
    return [person?.firstName, person?.middleName, person?.lastName].filter(Boolean).join(' ');
  }

  openDetail(event: CalendarOccurrence): void {
    this.detailOccurrence = event;
    this.detailModalVisible = true;
  }

  canUsePatientFilter(): boolean {
    if (this.perms.isPatient()) return false;
    return this.perms.permissionsOnly([
      PermissionKey.PATIENTS_VIEW_DEPARTMENT,
      PermissionKey.PATIENTS_VIEW_ALL,
      PermissionKey.PATIENTS_VIEW_DEPARTMENT,
      PermissionKey.PATIENTS_VIEW_ASSIGNED,
    ]);
  }

  canUseUserFilters(): boolean {
    return this.perms.permissionsOnly([PermissionKey.USERS_VIEW_DEPARTMENT]);
  }

  private loadOccurrences(): void {
    const filter: CalendarOccurrenceFilter = {
      from: startOfMonth(this.selectedDate),
      to: endOfMonth(this.selectedDate),
      occurrenceType: this.occurrenceType,
      patientId: this.selectedPatient?.id || this.patientId,
      therapistId: this.selectedTherapist?.id || this.therapistId,
      supervisorId: this.selectedSupervisor?.id || this.supervisorId,
    };

    this.loading = true;
    this.calendarService
      .getOccurrences(filter)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (occurrences) => {
          this.occurrences = occurrences;
          this.contentChange.emit(this.occurrences.length > 0);
        },
        (error) => {
          this.occurrences = [];
          this.contentChange.emit(false);
          this.errorService.handleError(error, { prefix: 'Unable to load calendar' });
        }
      );
  }

  private loadGoogleCalendarStatus(): void {
    this.calendarService.getGoogleCalendarIntegrationStatus().subscribe(
      (status) => (this.googleCalendarConfigured = !!status?.configured),
      () => (this.googleCalendarConfigured = false)
    );
  }
}
