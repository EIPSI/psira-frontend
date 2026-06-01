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
import { CalendarEvent, CalendarView } from '@app/pages/calendar/@types/calendar';
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
import { RandomizationsService } from '@app/pages/randomizations/@services/randomizations.service';
import { RandomizationRule, RandomizationRuleType } from '@app/pages/randomizations/@types/randomization';

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

@Component({
  selector: 'app-patient-calendar',
  templateUrl: './patient-calendar.component.html',
  styleUrls: ['./patient-calendar.component.scss'],
})
export class PatientCalendarComponent implements OnChanges {
  CT = CalendarCreateType;
  ACT = AssessmentContentType;
  FST = FixedSchemeSelectionType;
  @Input() patient: FormattedPatient;

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
  therapist?: User;
  editingEvent?: CalendarEvent;
  editStartAt?: Date;
  editEndAt?: Date;
  editModalVisible = false;
  createEventModalVisible = false;
  createTitle = '';
  createSessionKind = ClinicalSessionKind.CLINICAL;
  createStartAt = new Date();
  createEndAt = new Date(new Date().getTime() + 60 * 60 * 1000);
  createTherapist?: User;
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
  simpleAssessmentTypeId?: number;
  simpleContentType = AssessmentContentType.QUESTIONNAIRE;
  simpleQuestionnaireIds: string[] = [];
  simpleQuestionnaireBundleIds: string[] = [];
  simpleRandomizationRuleIds: number[] = [];
  simpleAvailabilityMinutes = 60;
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
    private randomizationsService: RandomizationsService,
    private recurrenceService: CalendarRecurrenceService
  ) {}

  ngOnChanges(): void {
    if (this.patient?.id) {
      this.currentUser = JSON.parse(localStorage.getItem('user')) as User;
      this.loadEvents();
      this.loadSchemes();
      this.loadAssessmentTypes();
      this.loadBundles();
      this.loadRandomizations();
      this.loadCaregivers();
    }
  }

  caregiverLabel(caregiver: SelectedCaregiver): string {
    return [caregiver.firstName, caregiver.lastName, caregiver.relation ? `(${caregiver.relation})` : null]
      .filter((part) => !!part)
      .join(' ');
  }

  openCreateEvent(date: Date = this.selectedDate, hour?: number): void {
    const startAt = new Date(date);
    startAt.setHours(hour ?? 9, 0, 0, 0);
    this.createType = CalendarCreateType.SESSION;
    this.createTitle = 'Sesión clínica';
    this.createSessionKind = ClinicalSessionKind.CLINICAL;
    this.createStartAt = startAt;
    this.createEndAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    this.createTherapist = this.therapist;
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
    this.simpleAvailabilityMinutes = 60;
    this.simpleResponderKind = 'PATIENT';
    this.simpleResponderUserId = this.patient?.userId;
    this.selectedCaregiverRelation = undefined;
    this.createEventModalVisible = true;
  }

  saveCreateEvent(): void {
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
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load questionnaires' })
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

  private saveSession(): void {
    if (!this.patient?.id || !this.createTitle || !this.createStartAt || !this.createEndAt) return;
    const sessions = this.buildSessionCreateInputs();
    if (!sessions.length) return;

    this.creating = true;
    forkJoin(sessions.map((session) => this.calendarService.createClinicalSession(session)))
      .pipe(finalize(() => (this.creating = false)))
      .subscribe(
        () => {
          this.createEventModalVisible = false;
          this.loadEvents();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to create clinical session' })
      );
  }

  private applyFixedScheme(): void {
    if (
      !this.patient?.id ||
      (this.fixedSchemeSelectionType === FixedSchemeSelectionType.SCHEME && !this.createFixedSchemeIds.length) ||
      (this.fixedSchemeSelectionType === FixedSchemeSelectionType.RANDOMIZATION && !this.createFixedRandomizationRuleIds.length)
    ) return;
    const patient = this.patient;
    const selectedItems: FixedSchemeApplySelection[] = this.fixedSchemeSelectionType === FixedSchemeSelectionType.SCHEME
      ? this.createFixedSchemeIds.map((schemeId) => ({ schemeId }))
      : this.createFixedRandomizationRuleIds.map((randomizationRuleId) => ({ randomizationRuleId }));
    this.creating = true;
    forkJoin(selectedItems.map((schemeSelection) =>
      this.schemesService.applyScheme({
        ...schemeSelection,
        patientId: patient.id,
        targetUserId: patient.userId,
        therapistId: this.createTherapist?.id || this.therapist?.id,
        responderUserId: patient.userId,
        clinicianId: this.createTherapist?.id || this.currentUser?.id,
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

  private buildSessionCreateInputs(): any[] {
    const patient = this.patient;
    return this.buildSessionOccurrences().map((occurrence) => ({
      title: this.createTitle,
      sessionKind: this.createSessionKind,
      startAt: occurrence.startAt,
      endAt: occurrence.endAt,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      schemeIds: this.createSessionSchemeIds,
      patientId: patient.id,
      targetUserId: patient.userId,
      therapistId: this.createTherapist?.id,
    }));
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
    const expirationDate = new Date(this.createStartAt.getTime() + this.simpleAvailabilityMinutes * 60000);
    const content = this.simpleAssessmentContentPayload();
    this.creating = true;
    this.calendarService
      .createAssessmentOccurrence({
        assessmentTypeId: this.simpleAssessmentTypeId,
        patientId: this.patient.id,
        targetUserId: this.patient.userId,
        responderUserId: this.simpleResponderUserId,
        clinicianId: this.currentUser.id,
        informantType: this.simpleResponderKind,
        informantCaregiverRelation: this.simpleResponderKind === 'CAREGIVER' ? this.selectedCaregiverRelation : null,
        ...content,
        dates: [
          {
            deliveryDate: this.createStartAt,
            expirationDate,
          },
        ],
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
    if (event.clinicalSessionId) return this.cancelSession(event);
    if (event.assessmentId && event.editable) return this.deleteAssessmentEvent(event);
  }

  private cancelSession(event: CalendarEvent): void {
    if (!event.clinicalSessionId) return;

    this.modalService.confirm({
      nzTitle: 'Cancelar sesion',
      nzContent: 'La sesion se cancelara. Esta accion no elimina el registro del calendario.',
      nzOkText: 'Continuar',
      nzCancelText: 'Volver',
      nzOnOk: () => this.confirmFutureRenumber(event),
    });
  }

  private deleteAssessmentEvent(event: CalendarEvent): void {
    if (!event.assessmentId || !event.editable) return;

    this.modalService.confirm({
      nzTitle: 'Descartar evaluación',
      nzContent: 'La evaluación quedará cancelada y dejará de mostrarse como pendiente.',
      nzOkText: 'Descartar',
      nzOkDanger: true,
      nzCancelText: 'Volver',
      nzOnOk: () => this.confirmDeleteAssessmentEvent(event),
    });
  }

  private confirmFutureRenumber(event: CalendarEvent): void {
    this.modalService.confirm({
      nzTitle: 'Renumerar sesiones futuras',
      nzContent: 'Si esta sesion ya no cuenta, las sesiones futuras pueden bajar un numero para mantener la secuencia.',
      nzOkText: 'Renumerar futuras',
      nzCancelText: 'No renumerar',
      nzClosable: false,
      nzMaskClosable: false,
      nzOnOk: () => this.cancelClinicalSession(event, true),
      nzOnCancel: () => this.cancelClinicalSession(event, false),
    });
  }

  private cancelClinicalSession(event: CalendarEvent, renumberFutureSessions: boolean): void {
    this.saving = true;
    this.calendarService
      .discardCalendarEvent(event, {
        renumberFutureSessions,
        cancellationReason: 'Cancelled from patient calendar',
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => this.loadEvents(),
        (error) => this.errorService.handleError(error, { prefix: 'Unable to cancel session' })
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
        (error) => this.errorService.handleError(error, { prefix: 'Unable to delete assessment event' })
      );
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
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load patient calendar' })
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
    this.bundlesService.getQuestionnairesBundles({ departmentIds: this.contextDepartmentIds() } as any).subscribe(
      ({ data }: any) => {
        this.questionnaireBundles = data.getQuestionnaireBundles.edges.map((edge: any) => edge.node);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load questionnaire bundles' })
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
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load randomizations' })
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
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load caregivers' })
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
