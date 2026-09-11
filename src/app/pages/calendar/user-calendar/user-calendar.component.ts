import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { forkJoin, Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
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
import { UsersService } from '@app/pages/user-management/@services/users.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import {
  AddClinicalSessionSchemesApplicationMode,
  CalendarEvent,
  CalendarEventType,
  CalendarView,
  CaseEventReasonContext,
  ClinicalSessionCancellationReason,
  ClinicalSessionCancellationType,
  ClinicalSessionModality,
  ClinicalSessionSchemeApplication,
} from '../@types/calendar';
import { ClinicalSessionKind as CalendarClinicalSessionKind } from '../@types/calendar';
import { CalendarEventUiService } from '../@services/calendar-event-ui.service';
import { CalendarService } from '../@services/calendar.service';
import { CalendarRecurrenceService, RepeatEndMode, RepeatUnit } from '../@services/calendar-recurrence.service';
import { RandomizationsService } from '@app/pages/randomizations/@services/randomizations.service';
import { systemTimezone } from '@shared/utils/system-settings.util';
import { RandomizationRule, RandomizationRuleType } from '@app/pages/randomizations/@types/randomization';
import { EvaluationAutomationsService } from '@app/pages/evaluation-automations/@services/evaluation-automations.service';
import {
  EvaluationAutomationTriggerPoint,
  EvaluationAutomationTriggerPointLabel,
} from '@app/pages/evaluation-automations/@types/evaluation-automation';
import { TranslateService } from '@ngx-translate/core';

enum CalendarCreateType {
  SESSION = 'SESSION',
  FIXED_SCHEME = 'FIXED_SCHEME',
  SIMPLE_ASSESSMENT = 'SIMPLE_ASSESSMENT',
}

enum AssessmentContentType {
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  QUESTIONNAIRE_BUNDLE = 'QUESTIONNAIRE_BUNDLE',
  RANDOMIZATION = 'RANDOMIZATION',
}

enum FixedSchemeSelectionType {
  SCHEME = 'SCHEME',
  RANDOMIZATION = 'RANDOMIZATION',
}

type FixedSchemeApplySelection = { schemeId: number } | { randomizationRuleId: number };
type AssessmentAvailabilityUnit = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';

@Component({
  selector: 'app-user-calendar',
  templateUrl: './user-calendar.component.html',
  styleUrls: ['./user-calendar.component.scss'],
})
export class UserCalendarComponent implements OnChanges {
  CT = CalendarCreateType;
  ACT = AssessmentContentType;
  FST = FixedSchemeSelectionType;
  triggerPointLabel = EvaluationAutomationTriggerPointLabel;

  @Input() user?: User;
  @Input() hideGrid = false;
  @Input() allowExternalManagement = false;
  @Input() embeddedCreateMode = false;
  @Output() createSaved = new EventEmitter<void>();

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
  createModality = ClinicalSessionModality.IN_PERSON;
  createResponsibleUserIds: number[] = [];
  supervisorOptions: User[] = [];
  createSessionSchemeIds: number[] = [];
  createFixedSchemeIds: number[] = [];
  createFixedRandomizationRuleIds: number[] = [];
  fixedSchemeSelectionType = FixedSchemeSelectionType.SCHEME;
  repeatSession = false;
  repeatEvery = 1;
  repeatUnit = RepeatUnit.WEEK;
  repeatOnDays: number[] = [];
  repeatEndMode = RepeatEndMode.AFTER_COUNT;
  repeatEndDate?: Date;
  repeatCount = 12;
  simpleAssessmentTypeId?: number;
  simpleContentType = AssessmentContentType.QUESTIONNAIRE;
  simpleQuestionnaireIds: string[] = [];
  simpleQuestionnaireBundleIds: string[] = [];
  simpleRandomizationRuleIds: number[] = [];
  simpleAssessmentName = '';
  simpleAvailabilityMinutes = 60;
  simpleAvailabilityUnit: AssessmentAvailabilityUnit = 'MINUTES';
  simpleReminderMinutes = '';
  simpleReminderUnit: AssessmentAvailabilityUnit = 'MINUTES';
  simpleAssessmentNote = '';
  availabilityUnits: Array<{ label: string; value: AssessmentAvailabilityUnit }> = [
    { label: 'time.minutes', value: 'MINUTES' },
    { label: 'time.hours', value: 'HOURS' },
    { label: 'time.days', value: 'DAYS' },
    { label: 'time.weeks', value: 'WEEKS' },
    { label: 'time.months', value: 'MONTHS' },
  ];
  assessmentTypes: any[] = [];
  foundQuestionnaires: QuestionnaireVersion[] = [];
  questionnaireBundles: any[] = [];
  lowLevelRandomizations: RandomizationRule[] = [];
  highLevelRandomizations: RandomizationRule[] = [];
  editingEvent?: CalendarEvent;
  editStartAt?: Date;
  editEndAt?: Date;
  editSessionNumber?: number;
  editModality = ClinicalSessionModality.IN_PERSON;
  editDescription = '';
  editRestructure = false;
  editRestructureEvery = 1;
  editRestructureUnit = RepeatUnit.WEEK;
  editRestructureOnDays: number[] = [];
  editRestructureEndMode = RepeatEndMode.AFTER_COUNT;
  editRestructureEndDate?: Date;
  editRestructureCount = 12;
  editAddSchemeIds: number[] = [];
  editAddSchemesPropagate = false;
  editAddSchemesApplicationMode = AddClinicalSessionSchemesApplicationMode.RELATIVE_FROM_SESSION;
  editOverwriteExistingSchemes = false;
  editStopExistingSchemesFromSession = false;
  activeSchemeApplications: ClinicalSessionSchemeApplication[] = [];
  editModalVisible = false;
  createEventModalVisible = false;

  repeatUnits = this.recurrenceService.repeatUnits;
  weekDayOptions = this.recurrenceService.weekDayOptions;
  addSchemeApplicationModeOptions = [
    { label: 'patientsManagement.fromThisSession', value: AddClinicalSessionSchemesApplicationMode.RELATIVE_FROM_SESSION },
    { label: 'patientsManagement.originalStructure', value: AddClinicalSessionSchemesApplicationMode.ORIGINAL_SESSION_NUMBER },
  ];
  modalityOptions = [
    { label: 'patientsManagement.inPerson', value: ClinicalSessionModality.IN_PERSON },
    { label: 'patientsManagement.online', value: ClinicalSessionModality.ONLINE },
  ];

  private currentUser?: User;
  private draggedEvent?: CalendarEvent;
  contextEvent?: CalendarEvent;
  cancelModalVisible = false;
  cancelEvent?: CalendarEvent;
  cancelType = ClinicalSessionCancellationType.RESCHEDULED;
  cancelReasonId?: number;
  cancelOtherReason = '';
  cancelClinicalNote = '';
  cancellationReasons: ClinicalSessionCancellationReason[] = [];
  cancellationReasonLevels: ClinicalSessionCancellationReason[][] = [];
  selectedCancellationReasonIds: number[] = [];
  cancellationRootLabel = 'Motivo';
  automationPreview: any[] = [];
  automationPreviewLoading = false;
  skippedAutomationIds: number[] = [];

  get showCancellationOtherReason(): boolean {
    return this.isSelectedOtherReason(this.cancellationReasonLevels, this.cancelReasonId);
  }

  constructor(
    private assessmentAdministrationService: AssessmentAdministrationService,
    private bundlesService: QuestionnaireBundlesService,
    private calendarService: CalendarService,
    private errorService: ErrorHandlerService,
    private eventUiService: CalendarEventUiService,
    private modalService: NzModalService,
    private contextMenuService: NzContextMenuService,
    private questionnaireService: QuestionnaireManagementService,
    private randomizationsService: RandomizationsService,
    private recurrenceService: CalendarRecurrenceService,
    private schemesService: EvaluationSchemesService,
    private evaluationAutomationsService: EvaluationAutomationsService,
    private usersService: UsersService,
    private translate: TranslateService
  ) {}

  ngOnChanges(): void {
    if (!this.user?.id) return;
    this.currentUser = JSON.parse(localStorage.getItem('user')) as User;
    this.loadEvents();
    this.loadSchemes();
    this.loadAssessmentTypes();
    this.loadBundles();
    this.loadRandomizations();
    this.loadSupervisors();
    this.loadCancellationReasons();
  }

  openCreateEvent(date: Date = this.selectedDate, hour?: number): void {
    if (!this.canManageUserCalendar()) {
      this.modalService.warning({
        nzTitle: this.translate.instant('calendar.therapistCalendar'),
        nzContent: this.translate.instant('calendar.onlyAssignedSupervisorsCanManage'),
      });
      return;
    }

    const startAt = new Date(date);
    startAt.setHours(hour ?? 9, 0, 0, 0);
    this.createType = CalendarCreateType.SESSION;
    this.createTitle = this.translate.instant('dashboard.supervision');
    this.createStartAt = startAt;
    this.createEndAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    this.createResponsibleUserIds = this.defaultSupervisorIds();
    this.createSupervisor = this.primaryResponsibleUser();
    this.createModality = ClinicalSessionModality.IN_PERSON;
    this.createSessionSchemeIds = [];
    this.createFixedSchemeIds = [];
    this.createFixedRandomizationRuleIds = [];
    this.fixedSchemeSelectionType = FixedSchemeSelectionType.SCHEME;
    this.repeatSession = false;
    this.repeatEvery = 1;
    this.repeatUnit = RepeatUnit.WEEK;
    this.repeatOnDays = [startAt.getDay()];
    this.repeatEndMode = RepeatEndMode.AFTER_COUNT;
    this.repeatEndDate = undefined;
    this.repeatCount = 12;
    this.simpleAssessmentTypeId = undefined;
    this.simpleContentType = AssessmentContentType.QUESTIONNAIRE;
    this.simpleQuestionnaireIds = [];
    this.simpleQuestionnaireBundleIds = [];
    this.simpleRandomizationRuleIds = [];
    this.simpleAssessmentName = '';
    this.simpleAvailabilityMinutes = 60;
    this.simpleAvailabilityUnit = 'MINUTES';
    this.simpleReminderMinutes = '';
    this.simpleReminderUnit = 'MINUTES';
    this.simpleAssessmentNote = '';
    this.createEventModalVisible = true;
  }

  saveCreateEvent(): void {
    if (!this.canManageUserCalendar()) return;
    if (this.createType === CalendarCreateType.SESSION) return this.saveSupervisionSessions();
    if (this.createType === CalendarCreateType.FIXED_SCHEME) return this.applyFixedSchemes();
    return this.saveSimpleAssessment();
  }

  openEdit(event: CalendarEvent): void {
    this.editingEvent = event;
    this.editStartAt = new Date(event.startAt);
    this.editEndAt = new Date(event.endAt);
    this.editSessionNumber = event.sessionNumber;
    this.editModality = event.modality || ClinicalSessionModality.IN_PERSON;
    this.editDescription = event.description || '';
    this.editRestructure = false;
    this.editRestructureEvery = 1;
    this.editRestructureUnit = RepeatUnit.WEEK;
    this.editRestructureOnDays = [this.editStartAt.getDay()];
    this.editRestructureEndMode = RepeatEndMode.AFTER_COUNT;
    this.editRestructureEndDate = undefined;
    this.editRestructureCount = 12;
    this.editAddSchemeIds = [];
    this.editAddSchemesPropagate = false;
    this.editAddSchemesApplicationMode = AddClinicalSessionSchemesApplicationMode.RELATIVE_FROM_SESSION;
    this.editOverwriteExistingSchemes = false;
    this.editStopExistingSchemesFromSession = false;
    this.activeSchemeApplications = [];
    if (event.clinicalSessionId) this.loadActiveSchemeApplications(event.clinicalSessionId);
    this.editModalVisible = true;
  }

  stopActiveScheme(application: ClinicalSessionSchemeApplication): void {
    if (!this.editingEvent?.clinicalSessionId) return;
    this.modalService.confirm({
      nzTitle: this.translate.instant('patientsManagement.stopScheme'),
      nzContent: this.translate.instant('calendar.stopSchemeConfirmLong'),
      nzOkText: this.translate.instant('patientsManagement.stop'),
      nzOkDanger: true,
      nzCancelText: this.translate.instant('core.back'),
      nzOnOk: () => {
        this.saving = true;
        this.calendarService
          .stopClinicalSessionScheme(this.editingEvent.clinicalSessionId as number, application.schemeId)
          .pipe(finalize(() => (this.saving = false)))
          .subscribe(
            () => {
              this.loadActiveSchemeApplications(this.editingEvent.clinicalSessionId as number);
              this.loadEvents();
            },
            (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableStopEvaluationScheme') })
          );
      },
    });
  }

  openEventContextMenu(event: MouseEvent, menu: NzDropdownMenuComponent, calendarEvent: CalendarEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextEvent = calendarEvent;
    this.contextMenuService.create(event, menu);
  }

  openContextEvent(): void {
    if (!this.contextEvent) return;
    this.openEdit(this.contextEvent);
  }

  duplicateContextEvent(): void {
    if (!this.contextEvent) return;
    this.duplicateEvent(this.contextEvent);
  }

  discardContextEvent(): void {
    if (!this.contextEvent) return;
    this.discardEvent(this.contextEvent);
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

  onCreateTypeChange(type: CalendarCreateType): void {
    this.createType = type;
    this.createTitle = this.defaultCreateTitle(type);
  }

  private defaultCreateTitle(type: CalendarCreateType): string {
    if (type === CalendarCreateType.FIXED_SCHEME) return this.translate.instant('calendar.fixedSchemeAssessment');
    if (type === CalendarCreateType.SIMPLE_ASSESSMENT) return this.translate.instant('calendar.individualAssessment');
    return this.translate.instant('dashboard.supervision');
  }

  setEditDurationMinutes(minutes: number): void {
    if (!this.editStartAt) return;
    this.editEndAt = this.eventUiService.endFromDuration(this.editStartAt, minutes);
  }

  saveEdit(): void {
    if (!this.editingEvent || !this.editStartAt || !this.editEndAt) return;
    if (!this.editingEvent.editable) return;
    const clinicalSessionId = this.editingEvent.clinicalSessionId;
    const occurrenceId = this.editingEvent.occurrenceId;
    if (!clinicalSessionId && !occurrenceId) return;

    if (clinicalSessionId) {
      this.saving = true;
      const update$ = this.calendarService
        .updateClinicalSession({
          clinicalSessionId,
          sessionNumber: this.editSessionNumber ? Number(this.editSessionNumber) : undefined,
          startAt: this.editStartAt,
          endAt: this.editEndAt,
          clinicalHistory: this.editDescription,
          modality: this.editModality,
        });
      const save$: Observable<any> = this.editRestructure
        ? update$.pipe(
            switchMap(() =>
              this.calendarService.restructureClinicalSessions({
                clinicalSessionId,
                startAt: this.editStartAt as Date,
                endAt: this.editEndAt as Date,
                every: this.editRestructureEvery,
                unit: this.editRestructureUnit as any,
                repeatOnDays: this.editRestructureOnDays,
                endMode: this.editRestructureEndMode as any,
                endDate: this.editRestructureEndDate,
                count: this.editRestructureCount,
              })
            )
          )
        : update$;
      const saveWithSchemes$: Observable<any> = this.editAddSchemeIds.length
        ? save$.pipe(
            switchMap(() =>
              this.calendarService.addClinicalSessionSchemes({
                clinicalSessionId,
                propagateFuture: this.editRestructure || this.editAddSchemesPropagate,
                schemeIds: this.editAddSchemeIds,
                applicationMode: this.editAddSchemesApplicationMode,
                overwriteExisting: this.editOverwriteExistingSchemes,
              })
            )
          )
        : save$;
      saveWithSchemes$
        .pipe(finalize(() => (this.saving = false)))
        .subscribe(
          () => {
            this.editModalVisible = false;
            this.loadEvents();
          },
          (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableUpdateSession') })
        );
      return;
    }

    this.moveEvent(this.editingEvent, this.editStartAt, this.editEndAt, true);
  }

  discardEvent(event: CalendarEvent): void {
    if (!event.deletable) return;
    if (event.type === CalendarEventType.SESSION && event.clinicalSessionId) return this.discardSession(event);
    if (event.type === CalendarEventType.ASSESSMENT && event.assessmentId) return this.discardAssessment(event);
  }

  searchQuestionnaires(search: string): void {
    const filter = search ? { or: this.createQuestionnaireSearchFilter(search) } : undefined;
    this.questionnaireService.getQuestionnaires({ filter, departmentIds: this.contextDepartmentIds() }).subscribe(
      ({ edges }) => {
        this.foundQuestionnaires = edges
          .map((edge: any) => edge.node)
          .filter((questionnaire: QuestionnaireVersion) =>
            questionnaire.zombie === false &&
            [QuestionnaireStatus.PRIVATE, QuestionnaireStatus.PUBLISHED].includes(questionnaire.status) &&
            this.matchesDepartments(questionnaire.departmentIds)
          );
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('questionnaires.unableLoadQuestionnaires') })
    );
  }

  onSimpleContentTypeChange(type: AssessmentContentType): void {
    this.simpleContentType = type;
    if (type !== AssessmentContentType.QUESTIONNAIRE) this.simpleQuestionnaireIds = [];
    if (type !== AssessmentContentType.QUESTIONNAIRE_BUNDLE) this.simpleQuestionnaireBundleIds = [];
    if (type !== AssessmentContentType.RANDOMIZATION) this.simpleRandomizationRuleIds = [];
  }

  onFixedSchemeSelectionTypeChange(type: FixedSchemeSelectionType): void {
    this.fixedSchemeSelectionType = type;
    if (type !== FixedSchemeSelectionType.SCHEME) this.createFixedSchemeIds = [];
    if (type !== FixedSchemeSelectionType.RANDOMIZATION) this.createFixedRandomizationRuleIds = [];
  }

  private saveSupervisionSessions(): void {
    if (!this.user?.id || !this.createStartAt || !this.createEndAt) return;
    const responsibleUserIds = this.selectedResponsibleUserIds();
    const primaryResponsibleUserId = this.primaryResponsibleUserId() || this.currentUser?.id;
    const sessions = this.buildSessionOccurrences().map((occurrence) => ({
        title: this.createTitle || this.translate.instant('dashboard.supervision'),
      sessionKind: ClinicalSessionKind.SUPERVISION,
      startAt: occurrence.startAt,
      endAt: occurrence.endAt,
      timezone: systemTimezone(),
      schemeIds: this.createSessionSchemeIds,
      targetUserId: this.user.id,
      therapistId: this.user.id,
      supervisorId: primaryResponsibleUserId,
      responsibleUserIds,
      modality: this.createModality,
    }));
    if (!sessions.length) return;

    this.creating = true;
    forkJoin(sessions.map((session) => this.calendarService.createClinicalSession(session)))
      .pipe(finalize(() => (this.creating = false)))
      .subscribe(
        () => {
          this.createEventModalVisible = false;
          this.createSaved.emit();
          this.loadEvents();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableCreateSupervisionSession') })
      );
  }

  private applyFixedSchemes(): void {
    if (
      !this.user?.id ||
      (this.fixedSchemeSelectionType === FixedSchemeSelectionType.SCHEME && !this.createFixedSchemeIds.length) ||
      (this.fixedSchemeSelectionType === FixedSchemeSelectionType.RANDOMIZATION && !this.createFixedRandomizationRuleIds.length)
    ) return;
    const userId = this.user.id;
    const primaryResponsibleUserId = this.primaryResponsibleUserId() || this.currentUser?.id;
    const selectedItems: FixedSchemeApplySelection[] = this.fixedSchemeSelectionType === FixedSchemeSelectionType.SCHEME
      ? this.createFixedSchemeIds.map((schemeId) => ({ schemeId }))
      : this.createFixedRandomizationRuleIds.map((randomizationRuleId) => ({ randomizationRuleId }));
    this.creating = true;
    forkJoin(selectedItems.map((schemeSelection) =>
      this.schemesService.applyScheme({
        ...schemeSelection,
        targetUserId: userId,
        therapistId: userId,
        supervisorId: primaryResponsibleUserId,
        responderUserId: userId,
        clinicianId: primaryResponsibleUserId || userId,
        startDate: this.createStartAt,
        timezone: systemTimezone(),
      })
    ))
      .pipe(finalize(() => (this.creating = false)))
      .subscribe(
        () => {
          this.createEventModalVisible = false;
          this.createSaved.emit();
          this.loadEvents();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableApplyFixedScheme') })
      );
  }

  private saveSimpleAssessment(): void {
    if (!this.user?.id || !this.simpleAssessmentTypeId) return;
    const expirationDate = this.simpleExpirationDate();
    const content = this.simpleAssessmentContentPayload();
    const responsibleUserIds = this.selectedResponsibleUserIds();
    const primaryResponsibleUserId = this.primaryResponsibleUserId() || this.currentUser?.id || this.user.id;
    this.creating = true;
    this.calendarService
      .createAssessmentOccurrence({
        name: this.simpleAssessmentName?.trim() || null,
        assessmentTypeId: this.simpleAssessmentTypeId,
        targetUserId: this.user.id,
        responderUserId: this.user.id,
        clinicianId: primaryResponsibleUserId,
        responsibleUserIds,
        informantType: 'CLINICIAN',
        note: this.simpleAssessmentNote,
        ...content,
        dates: [
          {
            deliveryDate: this.createStartAt,
            expirationDate,
            reminderMinutes: this.parseReminderMinutes(this.simpleReminderMinutes, this.simpleReminderUnit),
            reminderUnit: this.simpleReminderUnit,
          },
        ],
        reminderUnit: this.simpleReminderUnit,
      })
      .pipe(finalize(() => (this.creating = false)))
      .subscribe(
        () => {
          this.createEventModalVisible = false;
          this.createSaved.emit();
          this.loadEvents();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableCreateAssessment') })
      );
  }

  private simpleExpirationDate(): Date {
    const expirationDate = new Date(this.createStartAt);
    const amount = Math.max(0, Number(this.simpleAvailabilityMinutes || 0));
    switch (this.simpleAvailabilityUnit) {
      case 'HOURS':
        expirationDate.setHours(expirationDate.getHours() + amount);
        break;
      case 'DAYS':
        expirationDate.setDate(expirationDate.getDate() + amount);
        break;
      case 'WEEKS':
        expirationDate.setDate(expirationDate.getDate() + amount * 7);
        break;
      case 'MONTHS':
        expirationDate.setMonth(expirationDate.getMonth() + amount);
        break;
      default:
        expirationDate.setMinutes(expirationDate.getMinutes() + amount);
    }
    return expirationDate;
  }

  private parseReminderMinutes(value: string, unit: AssessmentAvailabilityUnit = 'MINUTES'): number[] {
    return (value || '')
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry) && entry >= 0)
      .map((entry) => this.unitAmountToMinutes(entry, unit));
  }

  private unitAmountToMinutes(value: number, unit: AssessmentAvailabilityUnit = 'MINUTES'): number {
    switch (unit) {
      case 'HOURS':
        return value * 60;
      case 'DAYS':
        return value * 24 * 60;
      case 'WEEKS':
        return value * 7 * 24 * 60;
      case 'MONTHS':
        return value * 30 * 24 * 60;
      default:
        return value;
    }
  }

  private discardSession(event: CalendarEvent): void {
    const clinicalSessionId = event.clinicalSessionId;
    if (!clinicalSessionId) return;
    this.modalService.confirm({
      nzTitle: this.translate.instant('patientsManagement.cancellation'),
      nzContent: this.translate.instant('calendar.sessionWillBeCancelled'),
      nzOkText: this.translate.instant('core.continue'),
      nzCancelText: this.translate.instant('core.back'),
      nzOnOk: () => this.openCancellationModal(event),
    });
  }

  private openCancellationModal(event: CalendarEvent): void {
    this.cancelEvent = event;
    this.cancelType = ClinicalSessionCancellationType.RESCHEDULED;
    this.cancelReasonId = undefined;
    this.cancelOtherReason = '';
    this.cancelClinicalNote = '';
    this.resetAutomationPreview();
    this.resetCancellationReasonSelection();
    this.cancelModalVisible = true;
  }

  onCancelTypeChange(type: ClinicalSessionCancellationType): void {
    this.cancelType = type;
    this.cancelReasonId = undefined;
    this.cancelOtherReason = '';
    this.cancelClinicalNote = '';
    this.resetAutomationPreview();
    this.resetCancellationReasonSelection();
    this.refreshCancellationAutomationPreview();
  }

  onCancellationReasonChange(levelIndex: number, reasonId?: number): void {
    this.selectedCancellationReasonIds = this.selectedCancellationReasonIds.slice(0, levelIndex);
    this.cancellationReasonLevels = this.cancellationReasonLevels.slice(0, levelIndex + 1);

    if (!reasonId) {
      this.cancelReasonId = this.selectedCancellationReasonIds[this.selectedCancellationReasonIds.length - 1];
      this.refreshCancellationAutomationPreview();
      return;
    }

    this.selectedCancellationReasonIds[levelIndex] = reasonId;
    this.cancelReasonId = reasonId;
    this.refreshCancellationAutomationPreview();
    this.calendarService.getClinicalSessionCancellationReasons(reasonId, CalendarClinicalSessionKind.SUPERVISION).subscribe(
      (children) => {
        if (children?.length) {
          this.cancellationReasonLevels[levelIndex + 1] = children;
        }
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableLoadCancellationReasonLevel') })
    );
  }

  cancellationReasonLevelLabel(levelIndex: number): string {
    if (levelIndex === 0) return this.cancellationRootLabel;
    const parentId = this.selectedCancellationReasonIds[levelIndex - 1];
    const parent = this.cancellationReasonLevels[levelIndex - 1]?.find(
      (reason) => Number(reason.id) === Number(parentId)
    );
    return parent?.nextLevelLabel || this.translate.instant('reasonTrees.subreason');
  }

  confirmCancellation(): void {
    if (!this.cancelEvent) return;
    if (this.cancelType === ClinicalSessionCancellationType.NO_SHOW && !this.cancelReasonId) {
      this.modalService.warning({
        nzTitle: this.translate.instant('calendar.reasonRequired'),
        nzContent: this.translate.instant('calendar.noShowReasonRequired'),
      });
      return;
    }
    if (this.cancelType === ClinicalSessionCancellationType.NO_SHOW && this.showCancellationOtherReason && !this.cancelOtherReason.trim()) {
      this.modalService.warning({
        nzTitle: this.translate.instant('calendar.otherReasonRequired'),
        nzContent: this.translate.instant('calendar.otherReasonDetailRequired'),
      });
      return;
    }
    this.saving = true;
    this.calendarService
      .discardCalendarEvent(this.cancelEvent, {
        renumberFutureSessions: true,
        cancellationType: this.cancelType,
        cancellationReason:
          this.cancelType === ClinicalSessionCancellationType.RESCHEDULED
            ? this.translate.instant('calendar.rescheduledCancellation')
            : undefined,
        cancellationReasonId:
          this.cancelType === ClinicalSessionCancellationType.NO_SHOW ? this.cancelReasonId : undefined,
        cancellationOtherReason:
          this.cancelType === ClinicalSessionCancellationType.NO_SHOW && this.showCancellationOtherReason
            ? this.cancelOtherReason.trim()
            : undefined,
        cancellationComment: this.cancelClinicalNote.trim() || undefined,
        excludedAutomationIds: this.skippedAutomationIds,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => {
          this.cancelModalVisible = false;
          this.editModalVisible = false;
          this.loadEvents();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableDiscardSession') })
      );
  }

  private discardAssessment(event: CalendarEvent): void {
    this.modalService.confirm({
      nzTitle: this.translate.instant('calendar.discardAssessment'),
      nzContent: this.translate.instant('calendar.assessmentDiscardConfirm'),
      nzOkText: this.translate.instant('patientsManagement.discard'),
      nzOkDanger: true,
      nzCancelText: this.translate.instant('core.back'),
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
            (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableDiscardAssessment') })
          );
      },
    });
  }

  private moveEvent(event: CalendarEvent, startAt: Date, endAt: Date, closeModal: boolean = false): void {
    this.saving = true;
    this.calendarService.moveCalendarEvent(event, startAt, endAt).pipe(finalize(() => (this.saving = false))).subscribe(
      () => {
        if (closeModal) this.editModalVisible = false;
        this.loadEvents();
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableMoveCalendarEvent') })
    );
  }

  private duplicateEvent(event: CalendarEvent): void {
    if (!event.clinicalSessionId || !event.editable || !this.user?.id) {
      this.modalService.warning({
        nzTitle: this.translate.instant('calendar.duplicateEvent'),
        nzContent: this.translate.instant('calendar.onlySessionsCanBeDuplicated'),
      });
      return;
    }

    const responsibleUserIds = this.eventResponsibleUserIds(event);
    const primaryResponsibleUserId = responsibleUserIds[0];
    this.creating = true;
    this.calendarService
      .createClinicalSession({
        title: event.title,
        sessionKind: ClinicalSessionKind.SUPERVISION,
        startAt: new Date(event.startAt),
        endAt: new Date(event.endAt),
        timezone: systemTimezone(),
        targetUserId: this.user.id,
        therapistId: this.user.id,
        supervisorId: primaryResponsibleUserId,
        responsibleUserIds,
        modality: event.modality || ClinicalSessionModality.IN_PERSON,
      })
      .pipe(finalize(() => (this.creating = false)))
      .subscribe(
        () => this.loadEvents(),
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableDuplicateCalendarEvent') })
      );
  }

  toggleAutomationPreview(automationId: number, checked: boolean): void {
    this.skippedAutomationIds = checked
      ? this.skippedAutomationIds.filter((id) => id !== automationId)
      : [...new Set([...this.skippedAutomationIds, automationId])];
  }

  automationPreviewChecked(automationId: number): boolean {
    return !this.skippedAutomationIds.includes(automationId);
  }

  private resetAutomationPreview(): void {
    this.automationPreview = [];
    this.skippedAutomationIds = [];
    this.automationPreviewLoading = false;
  }

  private refreshCancellationAutomationPreview(): void {
    if (this.cancelType !== ClinicalSessionCancellationType.NO_SHOW) {
      this.resetAutomationPreview();
      return;
    }
    const departmentIds = this.contextDepartmentIds();
    const roleIds = this.userRoleIds();
    if (!departmentIds.length || !roleIds.length) {
      this.resetAutomationPreview();
      return;
    }

    this.automationPreviewLoading = true;
    this.evaluationAutomationsService
      .previewAutomations({
        roleIds,
        departmentIds,
        triggerPoint: EvaluationAutomationTriggerPoint.SESSION_NO_SHOW_CANCELLATION,
        reasonContexts: [CaseEventReasonContext.SUPERVISION_SESSION_CANCELLATION],
        reasonIds: this.selectedCancellationReasonIds.filter((id) => !!id),
      })
      .pipe(finalize(() => (this.automationPreviewLoading = false)))
      .subscribe(
        (automations) => {
          this.automationPreview = automations || [];
          const availableIds = this.automationPreview.map((automation) => automation.automationId);
          this.skippedAutomationIds = this.skippedAutomationIds.filter((id) => availableIds.includes(id));
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableLoadAutomationPreview') })
      );
  }

  private userRoleIds(): number[] {
    return (this.user?.roles || [])
      .map((role: any) => Number(role.id))
      .filter((id: number) => Number.isFinite(id));
  }

  private canManageUserCalendar(): boolean {
    if (this.allowExternalManagement) return true;
    const currentUserId = Number(this.currentUser?.id);
    return !!currentUserId && this.supervisorOptions.some((user) => Number(user.id) === currentUserId);
  }

  userLabel(user: User): string {
    return [user?.firstName, user?.middleName, user?.lastName]
      .filter((part) => !!part)
      .join(' ') || user?.username || user?.email || `${this.translate.instant('userManagement.user')} ${user?.id}`;
  }

  onResponsibleUsersChange(userIds: number[]): void {
    this.createResponsibleUserIds = this.normalizeIds(userIds || []);
    this.createSupervisor = this.primaryResponsibleUser();
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
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableLoadTherapistCalendar') })
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
    this.schemesService.getSchemes({ departmentIds: this.contextDepartmentIds() }).subscribe(
      ({ edges }) => {
        this.schemes = edges.map((edge: any) => edge.node).filter((scheme: EvaluationScheme) => scheme.active);
        this.fixedSchemes = this.schemes.filter(
          (scheme: EvaluationScheme) => scheme.schemeType === EvaluationSchemeType.INDEPENDENT_EVALUATION
        );
        this.sessionSchemes = this.schemes.filter(
          (scheme: EvaluationScheme) => scheme.schemeType === EvaluationSchemeType.SESSION_BASED
        );
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('evaluationSchemes.unableLoadSchemes') })
    );
  }

  private loadAssessmentTypes(): void {
    this.assessmentAdministrationService.assessmentActive().subscribe(
      ({ data }: any) => (this.assessmentTypes = data.activeAssessmentTypes || []),
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('plannedAssessments.unableLoadAssessmentTypes') })
    );
  }

  private loadBundles(): void {
    this.bundlesService.getQuestionnairesBundles({ departmentIds: this.contextDepartmentIds() } as any).subscribe(
      ({ data }: any) => {
        this.questionnaireBundles = data.getQuestionnaireBundles.edges.map((edge: any) => edge.node);
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableLoadQuestionnaireBundles') })
    );
  }

  private loadRandomizations(): void {
    this.randomizationsService
      .getRandomizations({
        paging: { first: 50 },
        departmentIds: this.contextDepartmentIds(),
        filter: {},
      })
      .subscribe(
        ({ edges }) => {
          const randomizations = edges.map((edge: any) => edge.node).filter((rule: RandomizationRule) => rule.active);
          this.lowLevelRandomizations = randomizations.filter(
            (randomization: RandomizationRule) => randomization.type === RandomizationRuleType.LOW_LEVEL
          );
          this.highLevelRandomizations = randomizations.filter(
            (randomization: RandomizationRule) => randomization.type === RandomizationRuleType.HIGH_LEVEL
          );
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('randomizations.unableLoadRandomizations') })
      );
  }

  private loadSupervisors(): void {
    if (!this.user?.id) return;
    this.usersService.getSupervisors({ first: 50, therapistId: this.user.id }).subscribe(
      ({ data }: any) => {
        this.supervisorOptions = (data?.supervisors?.edges || []).map((edge: any) => edge.node);
        if (!this.createEventModalVisible) return;
        this.createResponsibleUserIds = this.defaultSupervisorIds();
        this.createSupervisor = this.primaryResponsibleUser();
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableLoadSupervisors') })
    );
  }

  private loadCancellationReasons(): void {
    this.loadCancellationRootLabel();
    this.calendarService.getClinicalSessionCancellationReasons(undefined, CalendarClinicalSessionKind.SUPERVISION).subscribe(
      (reasons) => {
        this.cancellationReasons = reasons || [];
        this.resetCancellationReasonSelection();
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableLoadCancellationReasons') })
    );
  }

  private loadCancellationRootLabel(): void {
    this.calendarService.getCaseEventReasonTrees(false).subscribe(
      (trees) => {
        const tree = (trees || []).find((item) =>
          item.context === CaseEventReasonContext.SUPERVISION_SESSION_CANCELLATION &&
          !item.departmentId
        ) || (trees || []).find((item) => item.context === CaseEventReasonContext.SUPERVISION_SESSION_CANCELLATION);
        this.cancellationRootLabel = tree?.levelLabels?.[0] || this.translate.instant('reasonTrees.reason');
      },
      () => (this.cancellationRootLabel = this.translate.instant('reasonTrees.reason'))
    );
  }

  private loadActiveSchemeApplications(clinicalSessionId: number): void {
    this.calendarService.getClinicalSessionSchemeApplications(clinicalSessionId).subscribe(
      (applications) => (this.activeSchemeApplications = applications || []),
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadActiveEvaluationSchemes') })
    );
  }

  private resetCancellationReasonSelection(): void {
    this.selectedCancellationReasonIds = [];
    this.cancellationReasonLevels = this.cancellationReasons.length ? [this.cancellationReasons] : [];
  }

  private isSelectedOtherReason(levels: ClinicalSessionCancellationReason[][], reasonId?: number): boolean {
    if (!reasonId) return false;
    return levels.some((level) => level.some((reason) => Number(reason.id) === Number(reasonId) && !!reason.isOther));
  }

  private defaultSupervisorIds(): number[] {
    const currentUserId = Number(this.currentUser?.id);
    if (this.allowExternalManagement && currentUserId) return [currentUserId];
    if (currentUserId && this.supervisorOptions.some((user) => Number(user.id) === currentUserId)) return [currentUserId];
    const firstSupervisorId = Number(this.supervisorOptions[0]?.id);
    return firstSupervisorId ? [firstSupervisorId] : [];
  }

  private selectedResponsibleUserIds(): number[] {
    return this.normalizeIds(this.createResponsibleUserIds || []);
  }

  private primaryResponsibleUserId(): number | undefined {
    return this.selectedResponsibleUserIds()[0];
  }

  private primaryResponsibleUser(): User | undefined {
    const userId = this.primaryResponsibleUserId();
    return this.supervisorOptions.find((user) => Number(user.id) === Number(userId));
  }

  private eventResponsibleUserIds(event: CalendarEvent): number[] {
    const eventIds = event.responsibleUserIds || [];
    const fallbackIds = [event.supervisorId, this.primaryResponsibleUserId(), this.currentUser?.id].filter(
      (id: number | undefined) => !!id
    );
    return this.normalizeIds([...(eventIds || []), ...(fallbackIds as number[])]);
  }

  private normalizeIds(ids: Array<number | string>): number[] {
    return Array.from(
      new Set(
        (ids || [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );
  }

  contextDepartmentIds(): number[] {
    return (this.user?.departments || []).map((department: any) => department.id);
  }

  private matchesDepartments(itemDepartmentIds: number[] = []): boolean {
    const departmentIds = this.contextDepartmentIds();
    if (!departmentIds.length || !itemDepartmentIds?.length) return true;
    return itemDepartmentIds.some((departmentId) => departmentIds.includes(Number(departmentId)));
  }

  private simpleAssessmentContentPayload(): {
    questionnaires: string[];
    questionnaireBundles: string[];
    randomizationRuleIds: number[];
  } {
    return {
      questionnaires:
        this.simpleContentType === AssessmentContentType.QUESTIONNAIRE ? this.simpleQuestionnaireIds : [],
      questionnaireBundles:
        this.simpleContentType === AssessmentContentType.QUESTIONNAIRE_BUNDLE ? this.simpleQuestionnaireBundleIds : [],
      randomizationRuleIds:
        this.simpleContentType === AssessmentContentType.RANDOMIZATION ? this.simpleRandomizationRuleIds : [],
    };
  }

  private createQuestionnaireSearchFilter(searchString: string): any[] {
    return [
      { name: { iLike: `%${searchString}%` } },
      { abbreviation: { iLike: `%${searchString}%` } },
      { keywords: { iLike: `%${searchString}%` } },
    ];
  }
}
