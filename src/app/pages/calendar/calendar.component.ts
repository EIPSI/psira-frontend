import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { finalize } from 'rxjs/operators';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TranslateService } from '@ngx-translate/core';
import { DepartmentsService } from '@app/pages/administration/@services/departments.service';
import { Department } from '@app/pages/administration/@types/department';
import { User } from '@app/pages/user-management/@types/user';
import { UsersService } from '@app/pages/user-management/@services/users.service';
import { PatientsService } from '@app/pages/patients-management/@services/patients.service';
import { PermissionKey } from '@shared/@types/permission';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { CalendarEvent, CalendarEventType, CalendarView, ClinicalSessionModality } from './@types/calendar';
import { CalendarEventUiService } from './@services/calendar-event-ui.service';
import { CalendarService } from './@services/calendar.service';
import { formatSystemDateTime, systemTimezone } from '@shared/utils/system-settings.util';
import { UserCalendarComponent } from './user-calendar/user-calendar.component';
import { PatientCalendarComponent } from '@app/pages/patients-management/calendar/patient-calendar.component';

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
  @ViewChild('targetUserCalendar') targetUserCalendar?: UserCalendarComponent;
  @ViewChild('targetPatientCalendar') targetPatientCalendar?: PatientCalendarComponent;

  CV = CalendarView;
  CET = CalendarEventType;
  PK = PermissionKey;
  selectedDate = new Date();
  view = CalendarView.MONTH;
  selectedTypes: CalendarEventType[] = [];
  selectedDepartmentIds: number[] = [];
  showOwnEvents = true;
  showManagedEvents = false;
  showPermittedEvents = false;
  loading = false;
  saving = false;
  events: CalendarEvent[] = [];
  departments: Department[] = [];
  selectedEvent?: CalendarEvent;
  detailModalVisible = false;
  editModalVisible = false;
  createModalVisible = false;
  editStartAt?: Date;
  editEndAt?: Date;
  editSessionNumber?: number;
  editModality = ClinicalSessionModality.IN_PERSON;
  editDescription = '';
  modalityOptions = [
    { label: 'patientsManagement.inPerson', value: ClinicalSessionModality.IN_PERSON },
    { label: 'patientsManagement.online', value: ClinicalSessionModality.ONLINE },
  ];
  targetUsers: User[] = [];
  targetUserId?: number;
  targetUser?: User;
  targetPatient?: any;
  loadingTargetPatient = false;
  private initialized = false;
  private draggedEvent?: CalendarEvent;
  private pendingCreateDate?: Date;
  private pendingCreateHour?: number;
  private currentUser?: User;

  constructor(
    private calendarService: CalendarService,
    private departmentsService: DepartmentsService,
    private usersService: UsersService,
    private patientsService: PatientsService,
    private eventUiService: CalendarEventUiService,
    private contextMenuService: NzContextMenuService,
    private modalService: NzModalService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initialized = true;
    this.currentUser = JSON.parse(localStorage.getItem('user')) as User;
    this.loadDepartments();
    this.loadTargetUsers();
    this.loadEvents();
  }

  ngOnChanges(): void {
    if (this.initialized) this.loadEvents();
  }

  onRangeChange(): void {
    this.loadEvents();
  }

  onFiltersChange(): void {
    this.loadEvents();
  }

  selectAllDepartments(): void {
    this.selectedDepartmentIds = this.departments.map((department) => Number(department.id)).filter(Boolean);
    this.loadEvents();
  }

  clearDepartments(): void {
    this.selectedDepartmentIds = [];
    this.loadEvents();
  }

  openCreateEvent(date: Date = this.selectedDate, hour?: number): void {
    if (!this.canCreateEvents()) return;
    this.pendingCreateDate = date;
    this.pendingCreateHour = hour;
    this.createModalVisible = true;
    if (this.targetUser) this.prepareTargetCalendarCreateModal();
  }

  onTargetUserChange(userId?: number): void {
    this.targetUserId = userId;
    this.targetUser = this.targetUsers.find((user) => Number(user.id) === Number(userId));
    this.targetPatient = undefined;
    this.prepareTargetCalendarCreateModal();
  }

  openEvent(event: CalendarEvent): void {
    this.selectedEvent = event;
    if (event.editable) {
      this.openEdit(event);
      return;
    }
    this.detailModalVisible = true;
  }

  openDetail(event?: CalendarEvent): void {
    this.selectedEvent = event || this.selectedEvent;
    if (!this.selectedEvent) return;
    this.detailModalVisible = true;
  }

  openEdit(event: CalendarEvent): void {
    if (!event.editable) return this.openDetail(event);
    this.selectedEvent = event;
    this.editStartAt = new Date(event.startAt);
    this.editEndAt = new Date(event.endAt);
    this.editSessionNumber = event.sessionNumber;
    this.editModality = event.modality || ClinicalSessionModality.IN_PERSON;
    this.editDescription = event.description || '';
    this.editModalVisible = true;
  }

  saveEdit(): void {
    if (!this.selectedEvent || !this.selectedEvent.editable || !this.editStartAt || !this.editEndAt) return;
    this.saving = true;
    const update$ = this.selectedEvent.clinicalSessionId
      ? this.calendarService.updateClinicalSession({
          clinicalSessionId: this.selectedEvent.clinicalSessionId,
          sessionNumber: this.editSessionNumber ? Number(this.editSessionNumber) : undefined,
          startAt: this.editStartAt,
          endAt: this.editEndAt,
          clinicalHistory: this.editDescription,
          modality: this.editModality,
        })
      : this.calendarService.moveCalendarEvent(this.selectedEvent, this.editStartAt, this.editEndAt);

    update$.pipe(finalize(() => (this.saving = false))).subscribe(
      () => {
        this.editModalVisible = false;
        this.loadEvents();
      },
      (error) =>
        this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableUpdateCalendarEvent') })
    );
  }

  setEditDurationMinutes(minutes: number): void {
    if (!this.editStartAt) return;
    this.editEndAt = this.eventUiService.endFromDuration(this.editStartAt, minutes);
  }

  openEventContextMenu(event: MouseEvent, menu: NzDropdownMenuComponent, calendarEvent: CalendarEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedEvent = calendarEvent;
    this.contextMenuService.create(event, menu);
  }

  onEventDragStart(event: DragEvent, calendarEvent: CalendarEvent): void {
    if (!calendarEvent.editable) return;
    this.draggedEvent = calendarEvent;
    this.eventUiService.setDragData(event, calendarEvent);
  }

  onDropEvent(event: DragEvent, date: Date, hour?: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.draggedEvent?.editable) return;
    const nextWindow = this.eventUiService.droppedWindow(this.draggedEvent, date, hour);
    this.moveEvent(this.draggedEvent, nextWindow.startAt, nextWindow.endAt);
    this.draggedEvent = undefined;
  }

  discardSelectedEvent(): void {
    const event = this.selectedEvent;
    if (!event?.deletable) return;
    this.modalService.confirm({
      nzTitle: this.translate.instant(
        event.type === CalendarEventType.ASSESSMENT
          ? 'patientsManagement.discardAssessment'
          : 'patientsManagement.cancellation'
      ),
      nzContent: this.translate.instant(
        event.type === CalendarEventType.ASSESSMENT
          ? 'patientsManagement.discardAssessmentConfirm'
          : 'patientsManagement.cancellationConfirm'
      ),
      nzOkText: this.translate.instant(
        event.type === CalendarEventType.ASSESSMENT ? 'patientsManagement.discard' : 'patientsManagement.continue'
      ),
      nzOkDanger: true,
      nzCancelText: this.translate.instant('patientsManagement.back'),
      nzOnOk: () => this.discardEvent(event),
    });
  }

  duplicateSelectedEvent(): void {
    const event = this.selectedEvent;
    if (!event?.editable || !event.clinicalSessionId || !event.sessionKind) return;
    this.saving = true;
    this.calendarService
      .createClinicalSession({
        title: event.rawTitle || event.title,
        sessionKind: event.sessionKind,
        startAt: new Date(event.startAt),
        endAt: new Date(event.endAt),
        timezone: systemTimezone(),
        patientId: event.patientId,
        targetUserId: event.patient?.userId,
        therapistId: event.therapistId,
        supervisorId: event.supervisorId,
        responsibleUserIds: event.responsibleUserIds || [],
        modality: event.modality || ClinicalSessionModality.IN_PERSON,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => this.loadEvents(),
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('calendar.unableDuplicateCalendarEvent'),
          })
      );
  }

  eventTypeLabel(event: CalendarEvent): string {
    return this.translate.instant(
      event.type === CalendarEventType.SESSION ? 'calendar.session' : 'calendar.assessment'
    );
  }

  personName(person?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    username?: string;
    email?: string;
  }): string {
    return (
      [person?.firstName, person?.middleName, person?.lastName].filter(Boolean).join(' ') ||
      person?.username ||
      person?.email ||
      ''
    );
  }

  targetUserLabel(user: User): string {
    return this.personName(user) || user.email || user.username || `#${user.id}`;
  }

  eventPrimaryPerson(event?: CalendarEvent): string {
    if (!event) return '';
    if (event.type === CalendarEventType.ASSESSMENT)
      return this.personName(event.responderUser || event.targetUser || event.patient);
    if (event.sessionKind === 'SUPERVISION') return this.personName(event.therapist || event.supervisor);
    return this.personName(event.patient || event.therapist || event.supervisor);
  }

  departmentNames(event?: CalendarEvent): string {
    return (event?.departments || []).map((department) => department.name).join(', ');
  }

  formatDateTime(value?: string): string {
    return value ? formatSystemDateTime(value) : '-';
  }

  canCreateEvents(): boolean {
    return this.perms.permissionsOnly([
      PermissionKey.CLINICAL_CREATE_ALL,
      PermissionKey.CLINICAL_CREATE_DEPARTMENT,
      PermissionKey.CLINICAL_CREATE_ASSIGNED,
      PermissionKey.ASSESSMENTS_CREATE_ALL,
      PermissionKey.ASSESSMENTS_CREATE_DEPARTMENT,
      PermissionKey.ASSESSMENTS_CREATE_ASSIGNED,
    ]);
  }

  canEditEvents(): boolean {
    return this.perms.permissionsOnly([
      PermissionKey.CLINICAL_EDIT_ALL,
      PermissionKey.CLINICAL_EDIT_DEPARTMENT,
      PermissionKey.CLINICAL_EDIT_ASSIGNED,
      PermissionKey.ASSESSMENTS_EDIT_ALL,
      PermissionKey.ASSESSMENTS_EDIT_DEPARTMENT,
      PermissionKey.ASSESSMENTS_EDIT_ASSIGNED,
    ]);
  }

  canUseManagedScope(): boolean {
    return this.canCreateEvents() && this.canEditEvents();
  }

  canUsePermittedScope(): boolean {
    return this.perms.permissionsOnly([
      PermissionKey.CLINICAL_VIEW_ALL,
      PermissionKey.CLINICAL_VIEW_DEPARTMENT,
      PermissionKey.ASSESSMENTS_VIEW_ALL,
      PermissionKey.ASSESSMENTS_VIEW_DEPARTMENT,
    ]);
  }

  targetUserIsPatient(): boolean {
    return this.isPatientUser(this.targetUser);
  }

  private loadEvents(): void {
    this.loading = true;
    this.calendarService
      .getCalendarEvents({
        from: this.rangeStart(),
        to: this.rangeEnd(),
        patientId: this.patientId,
        therapistId: this.therapistId,
        supervisorId: this.supervisorId,
        departmentIds: this.selectedDepartmentIds,
        types: this.selectedTypes,
        includeOwnEvents: this.showOwnEvents,
        includeManagedEvents: this.showManagedEvents,
        includePermittedEvents: this.showPermittedEvents,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (events) => {
          this.events = (events || []).map((event) => ({
            ...event,
            rawTitle: event.title,
            title: this.displayTitle(event),
          }));
          this.contentChange.emit(this.events.length > 0);
        },
        (error) => {
          this.events = [];
          this.contentChange.emit(false);
          this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableLoadCalendar') });
        }
      );
  }

  private loadDepartments(): void {
    this.departmentsService
      .departments({ paging: { first: 50 }, sorting: [{ field: 'name', direction: 'ASC' }] as any })
      .subscribe(
        ({ data }: any) => {
          this.departments = (data?.departments?.edges || []).map((edge: any) => edge.node);
        },
        () => (this.departments = [])
      );
  }

  private loadTargetUsers(): void {
    this.usersService
      .getUsers({
        paging: { first: 50 },
        sorting: [{ field: 'firstName', direction: 'ASC' } as any, { field: 'lastName', direction: 'ASC' } as any],
      })
      .subscribe(
        ({ data }: any) => {
          this.targetUsers = (data?.users?.edges || [])
            .map((edge: any) => edge.node)
            .filter((user: User) => this.canEditTargetUser(user));
          if (this.targetUserId)
            this.targetUser = this.targetUsers.find((user) => Number(user.id) === Number(this.targetUserId));
        },
        () => (this.targetUsers = [])
      );
  }

  private prepareTargetCalendarCreateModal(): void {
    if (!this.createModalVisible || !this.targetUser || !this.pendingCreateDate) return;
    if (this.isPatientUser(this.targetUser)) return this.loadTargetPatientAndOpen();
    this.openTargetCalendarCreateModal();
  }

  private loadTargetPatientAndOpen(): void {
    if (!this.targetUser?.id) return;
    this.loadingTargetPatient = true;
    this.patientsService
      .patients({
        paging: { first: 1 },
        filter: { userId: { eq: Number(this.targetUser.id) } },
      })
      .pipe(finalize(() => (this.loadingTargetPatient = false)))
      .subscribe(
        ({ data }: any) => {
          this.targetPatient = data?.patients?.edges?.[0]?.node;
          this.openTargetCalendarCreateModal();
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('patientsManagement.unableLoadPatients'),
          })
      );
  }

  private openTargetCalendarCreateModal(): void {
    if (!this.createModalVisible || !this.targetUser || !this.pendingCreateDate) return;
    setTimeout(() => {
      const calendar = this.isPatientUser(this.targetUser) ? this.targetPatientCalendar : this.targetUserCalendar;
      if (!calendar) return;
      calendar.openCreateEvent(this.pendingCreateDate, this.pendingCreateHour);
    });
  }

  onEmbeddedCreateSaved(): void {
    this.closeCreateModal();
    this.loadEvents();
  }

  closeCreateModal(): void {
    this.createModalVisible = false;
    this.pendingCreateDate = undefined;
    this.pendingCreateHour = undefined;
  }

  private canEditTargetUser(user: User): boolean {
    if (!user?.id || Number(user.id) === Number(this.currentUser?.id)) return false;
    if (this.isPatientUser(user))
      return this.canEditTargetByPermissions(user, [
        PermissionKey.CLINICAL_EDIT_ALL,
        PermissionKey.CLINICAL_EDIT_DEPARTMENT,
        PermissionKey.CLINICAL_EDIT_ASSIGNED,
        PermissionKey.ASSESSMENTS_EDIT_ALL,
        PermissionKey.ASSESSMENTS_EDIT_DEPARTMENT,
        PermissionKey.ASSESSMENTS_EDIT_ASSIGNED,
      ]);
    if (this.hasAnyRole(user, ['THERAPIST', 'SUPERVISOR']))
      return this.canEditTargetByPermissions(user, [
        PermissionKey.CLINICAL_EDIT_ALL,
        PermissionKey.CLINICAL_EDIT_DEPARTMENT,
        PermissionKey.CLINICAL_EDIT_ASSIGNED,
        PermissionKey.ASSESSMENTS_EDIT_ALL,
        PermissionKey.ASSESSMENTS_EDIT_DEPARTMENT,
        PermissionKey.ASSESSMENTS_EDIT_ASSIGNED,
      ]);
    return false;
  }

  private canEditTargetByPermissions(user: User, permissions: PermissionKey[]): boolean {
    if (!this.canCreateEvents()) return false;
    if (
      this.perms.isSuperAdmin() ||
      this.perms.permissionsOnly(permissions.filter((permission) => permission.endsWith('.all')) as PermissionKey[])
    )
      return true;
    if (
      this.sameDepartment(user) &&
      this.perms.permissionsOnly(
        permissions.filter((permission) => permission.endsWith('.department')) as PermissionKey[]
      )
    )
      return true;
    return (
      this.sameDepartment(user) &&
      this.perms.permissionsOnly(
        permissions.filter((permission) => permission.endsWith('.assigned')) as PermissionKey[]
      )
    );
  }

  private sameDepartment(user: User): boolean {
    const currentDepartmentIds = (this.currentUser?.departments || []).map((department: any) => Number(department.id));
    const targetDepartmentIds = (user.departments || []).map((department: any) => Number(department.id));
    return targetDepartmentIds.some((departmentId) => currentDepartmentIds.includes(departmentId));
  }

  private isPatientUser(user?: User): boolean {
    return this.hasAnyRole(user, ['PATIENT']);
  }

  private hasAnyRole(user: User | undefined, roleCodes: string[]): boolean {
    return !!user?.roles?.some((role: any) => roleCodes.includes(role.code));
  }

  private rangeStart(): Date {
    if (this.view === CalendarView.DAY) return startOfDay(this.selectedDate);
    if (this.view === CalendarView.WEEK) return startOfWeek(this.selectedDate);
    return startOfWeek(startOfMonth(this.selectedDate));
  }

  private rangeEnd(): Date {
    if (this.view === CalendarView.DAY) return endOfDay(this.selectedDate);
    if (this.view === CalendarView.WEEK) return endOfWeek(this.selectedDate);
    return endOfWeek(endOfMonth(this.selectedDate));
  }

  private moveEvent(event: CalendarEvent, startAt: Date, endAt: Date): void {
    this.saving = true;
    this.calendarService
      .moveCalendarEvent(event, startAt, endAt)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => this.loadEvents(),
        (error) =>
          this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableMoveCalendarEvent') })
      );
  }

  private discardEvent(event: CalendarEvent): void {
    this.saving = true;
    this.calendarService
      .discardCalendarEvent(event, {
        statusCancel: event.type === CalendarEventType.ASSESSMENT,
        renumberFutureSessions: event.type === CalendarEventType.SESSION,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => {
          this.editModalVisible = false;
          this.detailModalVisible = false;
          this.loadEvents();
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('calendar.unableDiscardCalendarEvent'),
          })
      );
  }

  private displayTitle(event: CalendarEvent): string {
    const pieces = [event.title];
    const person = this.eventPrimaryPerson(event);
    if (person) pieces.push(person);
    if (event.sessionNumber)
      pieces.push(this.translate.instant('dashboard.sessionNumber', { number: event.sessionNumber }));
    return pieces.filter(Boolean).join(' · ');
  }
}
