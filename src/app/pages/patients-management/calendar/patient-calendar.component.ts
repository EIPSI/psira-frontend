import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { forkJoin, from, Observable } from 'rxjs';
import { concatMap, finalize, switchMap, toArray } from 'rxjs/operators';
import { AssessmentAdministrationService } from '@app/pages/administration/@services/assessment-administration.service';
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
} from '@app/pages/calendar/@types/calendar';
import { CalendarService } from '@app/pages/calendar/@services/calendar.service';
import { CalendarEventUiService } from '@app/pages/calendar/@services/calendar-event-ui.service';
import { CalendarRecurrenceService, RepeatEndMode, RepeatUnit } from '@app/pages/calendar/@services/calendar-recurrence.service';
import {
  ClinicalSessionKind,
  EvaluationScheme,
  EvaluationSchemeType,
} from '@app/pages/evaluation-schemes/@types/evaluation-scheme';
import { EvaluationSchemesService } from '@app/pages/evaluation-schemes/@services/evaluation-schemes.service';
import { QuestionnaireBundlesService } from '@app/pages/questionnaire-management/@services/questionnaire-bundles.service';
import { QuestionnaireManagementService } from '@app/pages/questionnaire-management/@services/questionnaire-management.service';
import {
  QuestionnaireStatus,
  QuestionnaireVersion,
} from '@app/pages/questionnaire-management/@types/questionnaire';
import { User } from '@app/pages/user-management/@types/user';
import { CaregiversPatientService } from '../@services/caregivers-patient.service';
import { SelectedCaregiver } from '../@types/caregiver';
import { FormattedPatient } from '../@types/formatted-patient';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { systemTimezone } from '@shared/utils/system-settings.util';
import { RandomizationsService } from '@app/pages/randomizations/@services/randomizations.service';
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
  selector: 'app-patient-calendar',
  templateUrl: './patient-calendar.component.html',
  styleUrls: ['./patient-calendar.component.scss'],
})
export class PatientCalendarComponent implements OnChanges {
  CT = CalendarCreateType;
  ACT = AssessmentContentType;
  FST = FixedSchemeSelectionType;
  triggerPointLabel = EvaluationAutomationTriggerPointLabel;
  @Input() patient: FormattedPatient;
  @Input() hideGrid = false;
  @Input() allowExternalManagement = false;
  @Input() embeddedCreateMode = false;
  @Output() createSaved = new EventEmitter<void>();

  selectedDate = new Date();
  view = CalendarView.MONTH;
  loading = false;
  applying = false;
  saving = false;
  creating = false;
  events: CalendarEvent[] = [];
  schemes: EvaluationScheme[] = [];
  fixedSchemes: EvaluationScheme[] = [];
  sessionSchemes: EvaluationScheme[] = [];
  sessionKinds = Object.values(ClinicalSessionKind);
  createTypes = Object.values(CalendarCreateType);
  createType = CalendarCreateType.SESSION;
  caseAdministrators: User[] = [];
  therapist?: User;
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
  createTitle = '';
  createSessionKind = ClinicalSessionKind.CLINICAL;
  createStartAt = new Date();
  createEndAt = new Date(new Date().getTime() + 60 * 60 * 1000);
  createTherapist?: User;
  createModality = ClinicalSessionModality.IN_PERSON;
  createResponsibleUserIds: number[] = [];
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
  simpleResponderUserId?: number;
  simpleResponderKind: 'PATIENT' | 'CAREGIVER' = 'PATIENT';
  selectedCaregiverRelation?: string;
  assessmentTypes: any[] = [];
  caregivers: SelectedCaregiver[] = [];
  foundQuestionnaires: QuestionnaireVersion[] = [];
  questionnaireBundles: any[] = [];
  lowLevelRandomizations: RandomizationRule[] = [];
  highLevelRandomizations: RandomizationRule[] = [];
  private currentUser: User;
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
  cancellationRootLabel = '';
  automationPreview: any[] = [];
  automationPreviewLoading = false;
  skippedAutomationIds: number[] = [];

  get showCancellationOtherReason(): boolean {
    return this.isSelectedOtherReason(this.cancellationReasonLevels, this.cancelReasonId);
  }

  constructor(
    private assessmentAdministrationService: AssessmentAdministrationService,
    private calendarService: CalendarService,
    private caregiversPatientService: CaregiversPatientService,
    private questionnaireService: QuestionnaireManagementService,
    private bundlesService: QuestionnaireBundlesService,
    private schemesService: EvaluationSchemesService,
    private errorService: ErrorHandlerService,
    private eventUiService: CalendarEventUiService,
    private modalService: NzModalService,
    private contextMenuService: NzContextMenuService,
    private randomizationsService: RandomizationsService,
    private evaluationAutomationsService: EvaluationAutomationsService,
    private recurrenceService: CalendarRecurrenceService,
    private translate: TranslateService
  ) {}

  ngOnChanges(): void {
    if (this.patient?.id) {
      this.currentUser = JSON.parse(localStorage.getItem('user')) as User;
      this.caseAdministrators = this.buildCaseAdministratorOptions();
      this.loadEvents();
      this.loadSchemes();
      this.loadAssessmentTypes();
      this.loadBundles();
      this.loadRandomizations();
      this.loadCaregivers();
      this.loadCancellationReasons();
    }
  }

  caregiverLabel(caregiver: SelectedCaregiver): string {
    return [caregiver.firstName, caregiver.lastName, caregiver.relation ? `(${caregiver.relation})` : null]
      .filter((part) => !!part)
      .join(' ');
  }

  openCreateEvent(date: Date = this.selectedDate, hour?: number): void {
    if (!this.canManagePatientCalendar()) {
      this.modalService.warning({
        nzTitle: this.translate.instant('patientsManagement.caseCalendar'),
        nzContent: this.translate.instant('patientsManagement.onlyCaseManagersCanCreate'),
      });
      return;
    }

    const startAt = new Date(date);
    startAt.setHours(hour ?? 9, 0, 0, 0);
    this.createType = CalendarCreateType.SESSION;
    this.createTitle = 'Sesión clínica';
    this.createSessionKind = ClinicalSessionKind.CLINICAL;
    this.createStartAt = startAt;
    this.createEndAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    this.createResponsibleUserIds = this.defaultCaseAdministratorIds();
    this.createTherapist = this.primaryResponsibleUser();
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
    this.simpleResponderKind = 'PATIENT';
    this.simpleResponderUserId = this.patient?.userId;
    this.selectedCaregiverRelation = undefined;
    this.createEventModalVisible = true;
  }

  saveCreateEvent(): void {
    if (!this.canManagePatientCalendar()) return;
    if (this.createType === CalendarCreateType.SESSION) {
      this.saveSession();
      return;
    }
    if (this.createType === CalendarCreateType.FIXED_SCHEME) {
      this.applyFixedScheme();
      return;
    }
    this.saveSimpleAssessment();
  }

  searchQuestionnaires(search: string): void {
    const filter = search ? { or: this.createQuestionnaireSearchFilter(search) } : undefined;
    this.questionnaireService.getQuestionnaires({ filter, departmentIds: this.contextDepartmentIds() }).subscribe(
      ({ edges }) => {
        this.foundQuestionnaires = edges
          .map((edge: any) => edge.node)
          .filter(
            (questionnaire: QuestionnaireVersion) =>
              questionnaire.zombie === false &&
              [QuestionnaireStatus.PRIVATE, QuestionnaireStatus.PUBLISHED].includes(questionnaire.status) &&
              this.matchesDepartments(questionnaire.departmentIds)
          );
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadQuestionnaires') })
    );
  }

  onSimpleResponderKindChange(kind: 'PATIENT' | 'CAREGIVER'): void {
    this.simpleResponderKind = kind;
    if (kind === 'PATIENT') {
      this.simpleResponderUserId = this.patient?.userId;
      this.selectedCaregiverRelation = undefined;
      return;
    }

    const caregiver = this.caregivers.find((item) => item.userId);
    this.simpleResponderUserId = caregiver?.userId;
    this.selectedCaregiverRelation = caregiver?.relation;
  }

  onCaregiverResponderChange(userId: number): void {
    const caregiver = this.caregivers.find((item) => item.userId === userId);
    this.simpleResponderUserId = userId;
    this.selectedCaregiverRelation = caregiver?.relation;
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

  onCreateTypeChange(type: CalendarCreateType): void {
    this.createType = type;
    this.createTitle = this.defaultCreateTitle(type);
  }

  private defaultCreateTitle(type: CalendarCreateType): string {
    if (type === CalendarCreateType.FIXED_SCHEME) return this.translate.instant('patientsManagement.fixedSchemeAssessment');
    if (type === CalendarCreateType.SIMPLE_ASSESSMENT) return this.translate.instant('patientsManagement.individualAssessment');
    return this.translate.instant('patientsManagement.clinicalSession');
  }

  private saveSession(): void {
    if (!this.patient?.id || !this.createTitle || !this.createStartAt || !this.createEndAt) return;
    const sessions = this.buildSessionCreateInputs();
    if (!sessions.length) return;

    this.creating = true;
    from(sessions)
      .pipe(
        concatMap((session) => this.calendarService.createClinicalSession(session)),
        toArray(),
        finalize(() => (this.creating = false))
      )
      .subscribe(
        () => {
          this.createEventModalVisible = false;
          this.createSaved.emit();
          this.loadEvents();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableCreateClinicalSession') })
      );
  }

  private applyFixedScheme(): void {
    if (
      !this.patient?.id ||
      (this.fixedSchemeSelectionType === FixedSchemeSelectionType.SCHEME && !this.createFixedSchemeIds.length) ||
      (this.fixedSchemeSelectionType === FixedSchemeSelectionType.RANDOMIZATION && !this.createFixedRandomizationRuleIds.length)
    ) return;
    const patient = this.patient;
    const startDate = startOfDay(this.createStartAt);
    const primaryResponsibleUserId = this.primaryResponsibleUserId();
    const selectedItems: FixedSchemeApplySelection[] = this.fixedSchemeSelectionType === FixedSchemeSelectionType.SCHEME
      ? this.createFixedSchemeIds.map((schemeId) => ({ schemeId }))
      : this.createFixedRandomizationRuleIds.map((randomizationRuleId) => ({ randomizationRuleId }));
    this.creating = true;
    forkJoin(selectedItems.map((schemeSelection) =>
      this.schemesService.applyScheme({
        ...schemeSelection,
        patientId: patient.id,
        targetUserId: patient.userId,
        therapistId: primaryResponsibleUserId || this.therapist?.id,
        responderUserId: patient.userId,
        clinicianId: primaryResponsibleUserId || this.currentUser?.id,
        startDate,
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
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableApplyFixedScheme') })
      );
  }

  private buildSessionCreateInputs(): any[] {
    const patient = this.patient;
    const nextSessionNumber = this.nextSessionNumber();
    const responsibleUserIds = this.selectedResponsibleUserIds();
    const primaryResponsibleUserId = this.primaryResponsibleUserId();
    return this.buildSessionOccurrences()
      .sort((left, right) => left.startAt.getTime() - right.startAt.getTime())
      .map((occurrence, index) => ({
      title: this.createTitle,
      sessionKind: this.createSessionKind,
      startAt: occurrence.startAt,
      endAt: occurrence.endAt,
      sessionNumber: nextSessionNumber + index,
      timezone: systemTimezone(),
      schemeIds: this.createSessionSchemeIds,
      patientId: patient.id,
      targetUserId: patient.userId,
      therapistId: primaryResponsibleUserId,
      responsibleUserIds,
      modality: this.createModality,
    }));
  }

  private nextSessionNumber(): number {
    const existingNumbers = (this.events || [])
      .filter((event) => event.clinicalSessionId && event.sessionKind === this.createSessionKind)
      .map((event) => Number(event.sessionNumber || 0))
      .filter((sessionNumber) => Number.isFinite(sessionNumber));
    return Math.max(0, ...existingNumbers) + 1;
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

  private saveSimpleAssessment(): void {
    if (!this.patient?.id || !this.simpleAssessmentTypeId || !this.currentUser?.id || !this.simpleResponderUserId) return;
    const expirationDate = this.simpleExpirationDate();
    const content = this.simpleAssessmentContentPayload();
    const responsibleUserIds = this.selectedResponsibleUserIds();
    const primaryResponsibleUserId = this.primaryResponsibleUserId() || this.currentUser.id;
    this.creating = true;
    this.calendarService
      .createAssessmentOccurrence({
        name: this.simpleAssessmentName?.trim() || null,
        assessmentTypeId: this.simpleAssessmentTypeId,
        patientId: this.patient.id,
        targetUserId: this.patient.userId,
        responderUserId: this.simpleResponderUserId,
        clinicianId: primaryResponsibleUserId,
        responsibleUserIds,
        informantType: this.simpleResponderKind,
        informantCaregiverRelation: this.simpleResponderKind === 'CAREGIVER' ? this.selectedCaregiverRelation : null,
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
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableCreateAssessment') })
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
      nzContent: this.translate.instant('patientsManagement.stopSchemeConfirm'),
      nzOkText: this.translate.instant('patientsManagement.stop'),
      nzOkDanger: true,
      nzCancelText: this.translate.instant('patientsManagement.back'),
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
          (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableUpdateClinicalSession') })
        );
      return;
    }

    this.moveEvent(this.editingEvent, this.editStartAt, this.editEndAt, true);
  }

  discardEvent(event: CalendarEvent): void {
    if (!event.deletable) return;
    if (event.type === CalendarEventType.SESSION && event.clinicalSessionId) return this.cancelSession(event);
    if (event.type === CalendarEventType.ASSESSMENT && event.assessmentId) {
      return this.deleteAssessmentEvent(event);
    }
  }

  private cancelSession(event: CalendarEvent): void {
    if (!event.clinicalSessionId) return;

    this.modalService.confirm({
      nzTitle: this.translate.instant('patientsManagement.cancellation'),
      nzContent: this.translate.instant('patientsManagement.cancellationConfirm'),
      nzOkText: this.translate.instant('patientsManagement.continue'),
      nzCancelText: this.translate.instant('patientsManagement.back'),
      nzOnOk: () => this.openCancellationModal(event),
    });
  }

  private deleteAssessmentEvent(event: CalendarEvent): void {
    if (!event.assessmentId || !event.deletable) return;

    this.modalService.confirm({
      nzTitle: this.translate.instant('patientsManagement.discardAssessment'),
      nzContent: this.translate.instant('patientsManagement.discardAssessmentConfirm'),
      nzOkText: this.translate.instant('patientsManagement.discard'),
      nzOkDanger: true,
      nzCancelText: this.translate.instant('patientsManagement.back'),
      nzOnOk: () => this.confirmDeleteAssessmentEvent(event),
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
    this.calendarService.getClinicalSessionCancellationReasons(reasonId).subscribe(
      (children) => {
        if (children?.length) {
          this.cancellationReasonLevels[levelIndex + 1] = children;
        }
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadCancellationReasonLevel') })
    );
  }

  cancellationReasonLevelLabel(levelIndex: number): string {
    if (levelIndex === 0) return this.cancellationRootLabel;
    const parentId = this.selectedCancellationReasonIds[levelIndex - 1];
    const parent = this.cancellationReasonLevels[levelIndex - 1]?.find(
      (reason) => Number(reason.id) === Number(parentId)
    );
    return parent?.nextLevelLabel || this.translate.instant('patientsManagement.subreason');
  }

  confirmCancellation(): void {
    if (!this.cancelEvent) return;
    if (this.cancelType === ClinicalSessionCancellationType.NO_SHOW && !this.cancelReasonId) {
      this.modalService.warning({
        nzTitle: this.translate.instant('patientsManagement.reasonRequired'),
        nzContent: this.translate.instant('patientsManagement.reasonRequiredMessage'),
      });
      return;
    }
    if (this.cancelType === ClinicalSessionCancellationType.NO_SHOW && this.showCancellationOtherReason && !this.cancelOtherReason.trim()) {
      this.modalService.warning({
        nzTitle: this.translate.instant('patientsManagement.otherReasonRequired'),
        nzContent: this.translate.instant('patientsManagement.otherReasonRequiredMessage'),
      });
      return;
    }
    this.cancelClinicalSession(this.cancelEvent);
  }

  private cancelClinicalSession(event: CalendarEvent): void {
    this.saving = true;
    this.calendarService
      .discardCalendarEvent(event, {
        renumberFutureSessions: true,
        cancellationType: this.cancelType,
        cancellationReason:
          this.cancelType === ClinicalSessionCancellationType.RESCHEDULED
            ? this.translate.instant('patientsManagement.rescheduledCancellation')
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
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableCancelSession') })
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
    if (!departmentIds.length) {
      this.resetAutomationPreview();
      return;
    }
    this.automationPreviewLoading = true;
    this.evaluationAutomationsService
      .previewAutomations({
        roleCodes: ['PATIENT'],
        departmentIds,
        triggerPoint: EvaluationAutomationTriggerPoint.SESSION_NO_SHOW_CANCELLATION,
        reasonContexts: [CaseEventReasonContext.SESSION_CANCELLATION],
        reasonIds: this.selectedCancellationReasonIds.filter((id) => !!id),
      })
      .pipe(finalize(() => (this.automationPreviewLoading = false)))
      .subscribe(
        (automations) => {
          this.automationPreview = automations || [];
          const availableIds = this.automationPreview.map((automation) => automation.automationId);
          this.skippedAutomationIds = this.skippedAutomationIds.filter((id) => availableIds.includes(id));
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadAutomationPreview') })
      );
  }

  private confirmDeleteAssessmentEvent(event: CalendarEvent): void {
    this.saving = true;
    this.calendarService
      .discardCalendarEvent(event, { statusCancel: true })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => {
          this.editModalVisible = false;
          this.loadEvents();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableDeleteAssessmentEvent') })
      );
  }

  private moveEvent(event: CalendarEvent, startAt: Date, endAt: Date, closeModal: boolean = false): void {
    this.saving = true;
    this.calendarService.moveCalendarEvent(event, startAt, endAt).pipe(finalize(() => (this.saving = false))).subscribe(
      () => {
        if (closeModal) this.editModalVisible = false;
        this.loadEvents();
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableMoveCalendarEvent') })
    );
  }

  private duplicateEvent(event: CalendarEvent): void {
    if (!event.clinicalSessionId || !event.editable) {
      this.modalService.warning({
        nzTitle: this.translate.instant('patientsManagement.duplicateEvent'),
        nzContent: this.translate.instant('patientsManagement.onlySessionsCanBeDuplicated'),
      });
      return;
    }

    const startAt = new Date(event.startAt);
    const endAt = new Date(event.endAt);
    const responsibleUserIds = this.eventResponsibleUserIds(event);
    const primaryResponsibleUserId = responsibleUserIds[0];
    this.creating = true;
    this.calendarService
      .createClinicalSession({
        title: event.title,
        sessionKind: event.sessionKind || ClinicalSessionKind.CLINICAL,
        startAt,
        endAt,
        timezone: systemTimezone(),
        patientId: this.patient.id,
        targetUserId: this.patient.userId,
        therapistId: primaryResponsibleUserId,
        responsibleUserIds,
        modality: event.modality || ClinicalSessionModality.IN_PERSON,
      })
      .pipe(finalize(() => (this.creating = false)))
      .subscribe(
        () => this.loadEvents(),
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableDuplicateCalendarEvent') })
      );
  }

  private canManagePatientCalendar(): boolean {
    if (this.allowExternalManagement) return true;
    const currentUserId = Number(this.currentUser?.id);
    return !!currentUserId && this.caseAdministrators.some((user) => Number(user.id) === currentUserId);
  }

  userLabel(user: User): string {
    return [user?.firstName, user?.middleName, user?.lastName]
      .filter((part) => !!part)
      .join(' ') || user?.username || user?.email || `Usuario ${user?.id}`;
  }

  private buildCaseAdministratorOptions(): User[] {
    const managers = [...(this.patient?.caseManagers || [])];
    const managerIds = (this.patient?.caseManagerIds || []).map((id) => Number(id)).filter((id) => Number.isFinite(id));
    const currentUserId = Number(this.currentUser?.id);
    if (currentUserId && managerIds.includes(currentUserId) && !managers.some((manager) => Number(manager.id) === currentUserId)) {
      managers.push(this.currentUser);
    }
    managerIds.forEach((id) => {
      if (!managers.some((manager) => Number(manager.id) === id)) {
        managers.push({ id } as User);
      }
    });
    return managers;
  }

  onResponsibleUsersChange(userIds: number[]): void {
    this.createResponsibleUserIds = this.normalizeIds(userIds || []);
    this.createTherapist = this.primaryResponsibleUser();
  }

  private defaultCaseAdministratorIds(): number[] {
    const administrators = this.caseAdministrators;
    const currentUserId = Number(this.currentUser?.id);
    if (this.allowExternalManagement && currentUserId) return [currentUserId];
    if (currentUserId && administrators.some((user) => Number(user.id) === currentUserId)) return [currentUserId];
    const firstAdministratorId = Number(administrators[0]?.id);
    return firstAdministratorId ? [firstAdministratorId] : [];
  }

  private selectedResponsibleUserIds(): number[] {
    return this.normalizeIds(this.createResponsibleUserIds || []);
  }

  private primaryResponsibleUserId(): number | undefined {
    return this.selectedResponsibleUserIds()[0];
  }

  private primaryResponsibleUser(): User | undefined {
    const userId = this.primaryResponsibleUserId();
    return this.caseAdministrators.find((user) => Number(user.id) === Number(userId));
  }

  private eventResponsibleUserIds(event: CalendarEvent): number[] {
    const eventIds = event.responsibleUserIds || [];
    const fallbackIds = [event.therapistId, this.primaryResponsibleUserId(), this.therapist?.id].filter(
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

  loadEvents(): void {
    if (!this.patient?.id) return;
    this.loading = true;
    this.calendarService
      .getCalendarEvents({
        from: this.rangeStart(),
        to: this.rangeEnd(),
        patientId: this.patient.id,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (events) => (this.events = events),
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadPatientCalendar') })
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
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadSchemes') })
    );
  }

  private loadAssessmentTypes(): void {
    this.assessmentAdministrationService.assessmentActive().subscribe(
      ({ data }: any) => (this.assessmentTypes = data.activeAssessmentTypes || []),
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadAssessmentTypes') })
    );
  }

  private loadBundles(): void {
    this.bundlesService.getQuestionnairesBundles({ departmentIds: this.contextDepartmentIds() } as any).subscribe(
      ({ data }: any) => {
        this.questionnaireBundles = data.getQuestionnaireBundles.edges.map((edge: any) => edge.node);
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadQuestionnaireBundles') })
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
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadRandomizations') })
      );
  }

  contextDepartmentIds(): number[] {
    return (this.patient?.departments || []).map((department: any) => department.id);
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

  private loadCaregivers(): void {
    if (!this.patient?.id) return;

    this.caregiversPatientService
      .caregiversPatient({
        filter: { and: [{ patient: { id: { eq: this.patient.id } } }] },
      })
      .subscribe(
        ({ data }: any) => {
          this.caregivers = data.patientCaregivers.edges
            .filter((edge: any) => edge.node.caregiver?.userId)
            .map((edge: any) => ({
              ...edge.node.caregiver,
              relation: edge.node.relation,
            }));
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadCaregivers') })
      );
  }

  private loadCancellationReasons(): void {
    this.loadCancellationRootLabel();
    this.calendarService.getClinicalSessionCancellationReasons().subscribe(
      (reasons) => {
        this.cancellationReasons = reasons || [];
        this.resetCancellationReasonSelection();
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('patientsManagement.unableLoadCancellationReasons') })
    );
  }

  private loadCancellationRootLabel(): void {
    this.calendarService.getCaseEventReasonTrees(false).subscribe(
      (trees) => {
        const tree = (trees || []).find((item) =>
          item.context === CaseEventReasonContext.SESSION_CANCELLATION &&
          !item.departmentId
        ) || (trees || []).find((item) => item.context === CaseEventReasonContext.SESSION_CANCELLATION);
        this.cancellationRootLabel = tree?.levelLabels?.[0] || this.translate.instant('patientsManagement.reason');
      },
      () => (this.cancellationRootLabel = this.translate.instant('patientsManagement.reason'))
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

  private createQuestionnaireSearchFilter(searchString: string): any[] {
    return [
      { name: { iLike: `%${searchString}%` } },
      { abbreviation: { iLike: `%${searchString}%` } },
      { keywords: { iLike: `%${searchString}%` } },
    ];
  }
}
