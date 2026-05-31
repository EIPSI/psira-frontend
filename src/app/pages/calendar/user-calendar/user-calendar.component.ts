import { Component, Input, OnChanges } from '@angular/core';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AssessmentAdministrationService } from '@app/pages/administration/@services/assessment-administration.service';
import { EvaluationSchemesService } from '@app/pages/evaluation-schemes/@services/evaluation-schemes.service';
import {
  ClinicalSessionKind,
  EvaluationScheme,
  EvaluationSchemeType,
} from '@app/pages/evaluation-schemes/@types/evaluation-scheme';
import { QuestionnaireBundlesService } from '@app/pages/questionnaire-management/@services/questionnaire-bundles.service';
import { QuestionnaireManagementService } from '@app/pages/questionnaire-management/@services/questionnaire-management.service';
import {
  QuestionnaireStatus,
  QuestionnaireVersion,
} from '@app/pages/questionnaire-management/@types/questionnaire';
import { User } from '@app/pages/user-management/@types/user';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CalendarEvent, CalendarView } from '../@types/calendar';
import { ClinicalSessionKind as CalendarClinicalSessionKind } from '../@types/calendar';
import { CalendarEventUiService } from '../@services/calendar-event-ui.service';
import { CalendarService } from '../@services/calendar.service';
import { CalendarRecurrenceService, RepeatEndMode, RepeatUnit } from '../@services/calendar-recurrence.service';

enum CalendarCreateType {
  SESSION = 'SESSION',
  FIXED_SCHEME = 'FIXED_SCHEME',
  SIMPLE_ASSESSMENT = 'SIMPLE_ASSESSMENT',
}

@Component({
  selector: 'app-user-calendar',
  templateUrl: './user-calendar.component.html',
  styleUrls: ['./user-calendar.component.scss'],
})
export class UserCalendarComponent implements OnChanges {
  CT = CalendarCreateType;

  @Input() user?: User;

  selectedDate = new Date();
  view = CalendarView.MONTH;
  loading = false;
  saving = false;
  creating = false;
  events: CalendarEvent[] = [];
  schemes: EvaluationScheme[] = [];
  fixedSchemes: EvaluationScheme[] = [];
  sessionSchemes: EvaluationScheme[] = [];
  createType = CalendarCreateType.SESSION;
  createTitle = '';
  createStartAt = new Date();
  createEndAt = new Date(new Date().getTime() + 60 * 60 * 1000);
  createSupervisor?: User;
  createSessionSchemeIds: number[] = [];
  createFixedSchemeIds: number[] = [];
  repeatSession = false;
  repeatEvery = 1;
  repeatUnit = RepeatUnit.WEEK;
  repeatOnDays: number[] = [];
  repeatEndMode = RepeatEndMode.AFTER_COUNT;
  repeatEndDate?: Date;
  repeatCount = 12;
  simpleAssessmentTypeId?: number;
  simpleQuestionnaireIds: string[] = [];
  simpleQuestionnaireBundleIds: string[] = [];
  simpleAvailabilityMinutes = 60;
  assessmentTypes: any[] = [];
  foundQuestionnaires: QuestionnaireVersion[] = [];
  questionnaireBundles: any[] = [];
  editingEvent?: CalendarEvent;
  editStartAt?: Date;
  editEndAt?: Date;
  editModalVisible = false;
  createEventModalVisible = false;

  repeatUnits = this.recurrenceService.repeatUnits;
  weekDayOptions = this.recurrenceService.weekDayOptions;

  private currentUser?: User;
  private draggedEvent?: CalendarEvent;

  constructor(
    private assessmentAdministrationService: AssessmentAdministrationService,
    private bundlesService: QuestionnaireBundlesService,
    private calendarService: CalendarService,
    private errorService: ErrorHandlerService,
    private eventUiService: CalendarEventUiService,
    private modalService: NzModalService,
    private questionnaireService: QuestionnaireManagementService,
    private recurrenceService: CalendarRecurrenceService,
    private schemesService: EvaluationSchemesService
  ) {}

  ngOnChanges(): void {
    if (!this.user?.id) return;
    this.currentUser = JSON.parse(localStorage.getItem('user')) as User;
    this.loadEvents();
    this.loadSchemes();
    this.loadAssessmentTypes();
    this.loadBundles();
  }

  openCreateEvent(date: Date = this.selectedDate, hour?: number): void {
    const startAt = new Date(date);
    startAt.setHours(hour ?? 9, 0, 0, 0);
    this.createType = CalendarCreateType.SESSION;
    this.createTitle = 'Supervisión';
    this.createStartAt = startAt;
    this.createEndAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    this.createSupervisor = this.currentUser;
    this.createSessionSchemeIds = [];
    this.createFixedSchemeIds = [];
    this.repeatSession = false;
    this.repeatEvery = 1;
    this.repeatUnit = RepeatUnit.WEEK;
    this.repeatOnDays = [startAt.getDay()];
    this.repeatEndMode = RepeatEndMode.AFTER_COUNT;
    this.repeatEndDate = undefined;
    this.repeatCount = 12;
    this.simpleAssessmentTypeId = undefined;
    this.simpleQuestionnaireIds = [];
    this.simpleQuestionnaireBundleIds = [];
    this.simpleAvailabilityMinutes = 60;
    this.createEventModalVisible = true;
  }

  saveCreateEvent(): void {
    if (this.createType === CalendarCreateType.SESSION) return this.saveSupervisionSessions();
    if (this.createType === CalendarCreateType.FIXED_SCHEME) return this.applyFixedSchemes();
    return this.saveSimpleAssessment();
  }

  openEdit(event: CalendarEvent): void {
    this.editingEvent = event;
    this.editStartAt = new Date(event.startAt);
    this.editEndAt = new Date(event.endAt);
    this.editModalVisible = true;
  }

  onEventDragStart(event: DragEvent, calendarEvent: CalendarEvent): void {
    this.draggedEvent = calendarEvent;
    this.eventUiService.setDragData(event, calendarEvent);
  }

  onDropEvent(event: DragEvent, date: Date, hour?: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.draggedEvent) return;

    const nextWindow = this.eventUiService.droppedWindow(this.draggedEvent, date, hour);
    this.moveEvent(this.draggedEvent, nextWindow.startAt, nextWindow.endAt);
    this.draggedEvent = undefined;
  }

  allowDrop(event: DragEvent): void {
    this.eventUiService.allowDrop(event);
  }

  setEditDurationMinutes(minutes: number): void {
    if (!this.editStartAt) return;
    this.editEndAt = this.eventUiService.endFromDuration(this.editStartAt, minutes);
  }

  saveEdit(): void {
    if (!this.editingEvent || !this.editStartAt || !this.editEndAt) return;
    const clinicalSessionId = this.editingEvent.clinicalSessionId;
    const occurrenceId = this.editingEvent.occurrenceId;
    if (!clinicalSessionId && !occurrenceId) return;

    this.moveEvent(this.editingEvent, this.editStartAt, this.editEndAt, true);
  }

  discardEvent(event: CalendarEvent): void {
    if (event.clinicalSessionId) return this.discardSession(event);
    if (event.assessmentId && event.editable) return this.discardAssessment(event);
  }

  searchQuestionnaires(search: string): void {
    const filter = search ? { or: this.createQuestionnaireSearchFilter(search) } : undefined;
    this.questionnaireService.getQuestionnaires({ filter }).subscribe(
      ({ edges }) => {
        this.foundQuestionnaires = edges
          .map((edge: any) => edge.node)
          .filter((questionnaire: QuestionnaireVersion) =>
            questionnaire.zombie === false &&
            [QuestionnaireStatus.PRIVATE, QuestionnaireStatus.PUBLISHED].includes(questionnaire.status)
          );
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load questionnaires' })
    );
  }

  private saveSupervisionSessions(): void {
    if (!this.user?.id || !this.createStartAt || !this.createEndAt) return;
    const sessions = this.buildSessionOccurrences().map((occurrence) => ({
      title: this.createTitle || 'Supervisión',
      sessionKind: ClinicalSessionKind.SUPERVISION,
      startAt: occurrence.startAt,
      endAt: occurrence.endAt,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      schemeIds: this.createSessionSchemeIds,
      targetUserId: this.user.id,
      therapistId: this.user.id,
      supervisorId: this.createSupervisor?.id || this.currentUser?.id,
    }));
    if (!sessions.length) return;

    this.creating = true;
    forkJoin(sessions.map((session) => this.calendarService.createClinicalSession(session)))
      .pipe(finalize(() => (this.creating = false)))
      .subscribe(
        () => {
          this.createEventModalVisible = false;
          this.loadEvents();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to create supervision session' })
      );
  }

  private applyFixedSchemes(): void {
    if (!this.user?.id || !this.createFixedSchemeIds.length) return;
    const userId = this.user.id;
    this.creating = true;
    forkJoin(this.createFixedSchemeIds.map((schemeId) =>
      this.schemesService.applyScheme({
        schemeId,
        targetUserId: userId,
        therapistId: userId,
        responderUserId: userId,
        clinicianId: userId,
        startDate: this.createStartAt,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      })
    ))
      .pipe(finalize(() => (this.creating = false)))
      .subscribe(
        () => {
          this.createEventModalVisible = false;
          this.loadEvents();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to apply fixed scheme' })
      );
  }

  private saveSimpleAssessment(): void {
    if (!this.user?.id || !this.simpleAssessmentTypeId) return;
    const expirationDate = new Date(this.createStartAt.getTime() + this.simpleAvailabilityMinutes * 60000);
    this.creating = true;
    this.calendarService
      .createAssessmentOccurrence({
        assessmentTypeId: this.simpleAssessmentTypeId,
        targetUserId: this.user.id,
        responderUserId: this.user.id,
        clinicianId: this.user.id,
        informantType: 'CLINICIAN',
        questionnaires: this.simpleQuestionnaireIds,
        questionnaireBundles: this.simpleQuestionnaireBundleIds,
        dates: [{ deliveryDate: this.createStartAt, expirationDate }],
        emailReminder: false,
      })
      .pipe(finalize(() => (this.creating = false)))
      .subscribe(
        () => {
          this.createEventModalVisible = false;
          this.loadEvents();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to create assessment' })
      );
  }

  private discardSession(event: CalendarEvent): void {
    const clinicalSessionId = event.clinicalSessionId;
    if (!clinicalSessionId) return;
    this.modalService.confirm({
      nzTitle: 'Descartar sesión',
      nzContent: 'La sesión quedará cancelada y se ocultará por defecto.',
      nzOkText: 'Descartar',
      nzOkDanger: true,
      nzCancelText: 'Volver',
      nzOnOk: () => {
        this.saving = true;
        this.calendarService
          .discardCalendarEvent(event, {
            renumberFutureSessions: false,
            cancellationReason: 'Cancelled from therapist calendar',
          })
          .pipe(finalize(() => (this.saving = false)))
          .subscribe(
            () => {
              this.editModalVisible = false;
              this.loadEvents();
            },
            (error) => this.errorService.handleError(error, { prefix: 'Unable to discard session' })
          );
      },
    });
  }

  private discardAssessment(event: CalendarEvent): void {
    this.modalService.confirm({
      nzTitle: 'Descartar evaluación',
      nzContent: 'La evaluación quedará cancelada y dejará de mostrarse como pendiente.',
      nzOkText: 'Descartar',
      nzOkDanger: true,
      nzCancelText: 'Volver',
      nzOnOk: () => {
        this.saving = true;
        this.calendarService
          .discardCalendarEvent(event, { statusCancel: true })
          .pipe(finalize(() => (this.saving = false)))
          .subscribe(
            () => {
              this.editModalVisible = false;
              this.loadEvents();
            },
            (error) => this.errorService.handleError(error, { prefix: 'Unable to discard assessment' })
          );
      },
    });
  }

  private moveEvent(event: CalendarEvent, startAt: Date, endAt: Date, closeModal = false): void {
    this.saving = true;
    this.calendarService.moveCalendarEvent(event, startAt, endAt).pipe(finalize(() => (this.saving = false))).subscribe(
      () => {
        if (closeModal) this.editModalVisible = false;
        this.loadEvents();
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to move calendar event' })
    );
  }

  private buildSessionOccurrences(): Array<{ startAt: Date; endAt: Date }> {
    return this.recurrenceService.buildOccurrences({
      startAt: this.createStartAt,
      endAt: this.createEndAt,
      enabled: this.repeatSession,
      every: this.repeatEvery,
      unit: this.repeatUnit,
      repeatOnDays: this.repeatOnDays,
      endMode: this.repeatEndMode,
      endDate: this.repeatEndDate,
      count: this.repeatCount,
    });
  }

  loadEvents(): void {
    if (!this.user?.id) return;
    this.loading = true;
    this.calendarService
      .getCalendarEvents({
        from: this.rangeStart(),
        to: this.rangeEnd(),
        therapistId: this.user.id,
        sessionKind: CalendarClinicalSessionKind.SUPERVISION,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (events) => (this.events = events),
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load therapist calendar' })
      );
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

  private loadSchemes(): void {
    this.schemesService.getSchemes().subscribe(
      ({ edges }) => {
        this.schemes = edges.map((edge: any) => edge.node).filter((scheme: EvaluationScheme) => scheme.active);
        this.fixedSchemes = this.schemes.filter(
          (scheme: EvaluationScheme) => scheme.schemeType === EvaluationSchemeType.INDEPENDENT_EVALUATION
        );
        this.sessionSchemes = this.schemes.filter(
          (scheme: EvaluationScheme) => scheme.schemeType === EvaluationSchemeType.SESSION_BASED
        );
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load schemes' })
    );
  }

  private loadAssessmentTypes(): void {
    this.assessmentAdministrationService.assessmentActive().subscribe(
      ({ data }: any) => (this.assessmentTypes = data.activeAssessmentTypes || []),
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load assessment types' })
    );
  }

  private loadBundles(): void {
    this.bundlesService.getQuestionnairesBundles({ departmentIds: [] } as any).subscribe(
      ({ data }: any) => {
        this.questionnaireBundles = data.getQuestionnaireBundles.edges.map((edge: any) => edge.node);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load questionnaire bundles' })
    );
  }

  private createQuestionnaireSearchFilter(searchString: string): any[] {
    return [
      { name: { iLike: `%${searchString}%` } },
      { abbreviation: { iLike: `%${searchString}%` } },
      { keywords: { iLike: `%${searchString}%` } },
    ];
  }
}
