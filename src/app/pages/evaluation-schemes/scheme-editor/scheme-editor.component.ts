import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AssessmentAdministrationService } from '@app/pages/administration/@services/assessment-administration.service';
import { DepartmentsService } from '@app/pages/patients-management/@services/departments.service';
import { Department } from '@app/pages/patients-management/@types/department';
import { QuestionnaireManagementService } from '@app/pages/questionnaire-management/@services/questionnaire-management.service';
import { QuestionnaireBundlesService } from '@app/pages/questionnaire-management/@services/questionnaire-bundles.service';
import {
  QuestionnaireStatus,
  QuestionnaireVersion,
} from '@app/pages/questionnaire-management/@types/questionnaire';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { finalize } from 'rxjs/operators';
import {
  ClinicalSessionKind,
  ClinicalSessionResourceKind,
  EvaluationScheme,
  EvaluationSchemeType,
  EvaluationSchemeTypeLabel,
  ResourceActivationAnchor,
} from '../@types/evaluation-scheme';
import { EvaluationSchemesService } from '../@services/evaluation-schemes.service';
import { RandomizationsService } from '@app/pages/randomizations/@services/randomizations.service';
import { RandomizationRule, RandomizationRuleType } from '@app/pages/randomizations/@types/randomization';
import { TranslateService } from '@ngx-translate/core';

enum SessionTargetMode {
  SPECIFIC = 'SPECIFIC',
  FREQUENCY = 'FREQUENCY',
}

enum FixedTriggerMode {
  BLOCK_START = 'BLOCK_START',
  RANDOM_WITHIN_WINDOW = 'RANDOM_WITHIN_WINDOW',
}

enum FixedRepeatRuleMode {
  ADD_FROM_INTERACTION = 'ADD_FROM_INTERACTION',
  EXTEND_LAST_DAY = 'EXTEND_LAST_DAY',
  EXTEND_LAST_WEEK = 'EXTEND_LAST_WEEK',
}

enum AssessmentContentType {
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  QUESTIONNAIRE_BUNDLE = 'QUESTIONNAIRE_BUNDLE',
  RANDOMIZATION = 'RANDOMIZATION',
}

type TimeUnit = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';

@Component({
  selector: 'app-scheme-editor',
  templateUrl: './scheme-editor.component.html',
  styleUrls: ['./scheme-editor.component.scss'],
})
export class SchemeEditorComponent implements OnInit {
  private readonly maxFixedWeeks = 100;
  public schemeTypes = Object.values(EvaluationSchemeType);
  public schemeTypeLabel = EvaluationSchemeTypeLabel;
  public resourceKinds = [
    ClinicalSessionResourceKind.PRE_ASSESSMENT,
    ClinicalSessionResourceKind.POST_ASSESSMENT,
  ];
  public sessionTargetModes = Object.values(SessionTargetMode);
  public STM = SessionTargetMode;
  public scheme?: EvaluationScheme;
  public loading = false;
  public saving = false;
  public editingResourceId?: number;
  public editingFixedSlotId?: number;
  public contextResource?: any;
  public contextFixedSlot?: any;
  public fixedSlotModalVisible = false;
  public repeatRuleModalVisible = false;
  public draggedFixedSlot?: any;
  public draftSessionResources: any[] = [];
  public draftFixedSlots: any[] = [];
  private currentSchemeId?: number;
  private nextDraftResourceId = -1;
  private nextDraftFixedSlotId = -1;
  public selectedResourceKind = ClinicalSessionResourceKind.PRE_ASSESSMENT;
  public FTM = FixedTriggerMode;
  public FRM = FixedRepeatRuleMode;
  public assessmentTypes: any[] = [];
  public foundQuestionnaires: QuestionnaireVersion[] = [];
  public questionnaireBundles: any[] = [];
  public randomizations: RandomizationRule[] = [];
  public ACT = AssessmentContentType;
  public departments: Department[] = [];
  public timeUnits: Array<{ value: TimeUnit; label: string }> = [
    { value: 'MINUTES', label: 'time.minutes' },
    { value: 'HOURS', label: 'time.hours' },
    { value: 'DAYS', label: 'time.days' },
    { value: 'WEEKS', label: 'time.weeks' },
    { value: 'MONTHS', label: 'time.months' },
  ];
  public responderRoleOptions = [
    { label: 'roles.patient', value: 'PATIENT' },
    { label: 'roles.caregiver', value: 'CAREGIVER' },
    { label: 'roles.therapist', value: 'THERAPIST' },
    { label: 'roles.supervisor', value: 'SUPERVISOR' },
  ];
  public weekStartDay = 0;
  public fixedBlockSize = 7;
  public hours = Array.from({ length: 24 }, (_, index) => index);
  public quarterMinutes = [0, 15, 30, 45];
  public repeatPresets = [
    { label: 'evaluationSchemes.fivePerDay', value: 'FIVE_PER_DAY' },
    { label: 'evaluationSchemes.sevenPerDay', value: 'SEVEN_PER_DAY' },
    { label: 'evaluationSchemes.tenPerDay', value: 'TEN_PER_DAY' },
    { label: 'evaluationSchemes.morningNotification', value: 'MORNING_NOTIFICATION' },
    { label: 'evaluationSchemes.nightNotification', value: 'NIGHT_NOTIFICATION' },
  ];

  public baseForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    active: [true],
    departmentIds: [[]],
    durationDays: [7],
    schemeType: [EvaluationSchemeType.SESSION_BASED, Validators.required],
  });

  public sessionResourceForm: FormGroup = this.fb.group({
    resourceKind: [ClinicalSessionResourceKind.PRE_ASSESSMENT, Validators.required],
    assessmentTypeId: [null, Validators.required],
    name: [null],
    contentType: [AssessmentContentType.QUESTIONNAIRE, Validators.required],
    questionnaireId: [null],
    questionnaireBundleId: [null],
    randomizationRuleId: [null],
    sessionTargetMode: [SessionTargetMode.SPECIFIC, Validators.required],
    sessionSelector: ['1'],
    everyNSessions: [null],
    startSessionNumber: [1],
    endSessionNumber: [null],
    activationOffsetMinutes: [-15],
    availabilityDurationMinutes: [30],
    availabilityDurationUnit: ['MINUTES'],
    reminderMinutes: [''],
    reminderUnit: ['MINUTES'],
    responderRoles: [[]],
  });

  public fixedSlotForm: FormGroup = this.fb.group({
    assessmentTypeId: [null, Validators.required],
    name: [null],
    contentType: [AssessmentContentType.QUESTIONNAIRE, Validators.required],
    questionnaireId: [null],
    questionnaireBundleId: [null],
    randomizationRuleId: [null],
    relativeDay: [0, Validators.required],
    relativeMinuteOfDay: [9 * 60, Validators.required],
    startTime: ['09:00', Validators.required],
    endTime: ['10:00', Validators.required],
    durationMinutes: [60, Validators.required],
    endMinuteOfDay: [10 * 60],
    triggerMode: [FixedTriggerMode.BLOCK_START, Validators.required],
    availabilityDurationMinutes: [60, Validators.required],
    availabilityDurationUnit: ['MINUTES'],
    reminderMinutes: [''],
    reminderUnit: ['MINUTES'],
    required: [false],
    singleResponse: [true],
    seedOrder: [0],
    informantType: [''],
    responderRoles: [[]],
  });

  public repeatRuleForm: FormGroup = this.fb.group({
    mode: [FixedRepeatRuleMode.ADD_FROM_INTERACTION],
    assessmentTypeId: [null],
    name: [null],
    contentType: [AssessmentContentType.QUESTIONNAIRE],
    questionnaireId: [null],
    questionnaireBundleId: [null],
    randomizationRuleId: [null],
    preset: ['FIVE_PER_DAY'],
    startingDay: [1],
    numberOfDays: [7],
    numberOfWeeks: [1],
    triggerMode: [FixedTriggerMode.BLOCK_START],
    availabilityDurationMinutes: [60],
    availabilityDurationUnit: ['MINUTES'],
    reminderMinutes: [''],
    reminderUnit: ['MINUTES'],
    required: [false],
    singleResponse: [true],
    responderRoles: [[]],
  });

  get isNew(): boolean {
    return !this.currentSchemeId;
  }

  get isSessionBased(): boolean {
    return this.baseForm.get('schemeType').value === EvaluationSchemeType.SESSION_BASED;
  }

  get isFixedScheme(): boolean {
    return this.baseForm.get('schemeType').value === EvaluationSchemeType.INDEPENDENT_EVALUATION;
  }

  get sessionTargetMode(): SessionTargetMode {
    return this.sessionResourceForm.get('sessionTargetMode')?.value || SessionTargetMode.SPECIFIC;
  }

  get schemeDurationDays(): number {
    return Math.max(Number(this.baseForm.get('durationDays')?.value || this.scheme?.durationDays || 7), 7);
  }

  get visibleFixedDays(): number[] {
    return Array.from({ length: 7 }, (_, index) => this.weekStartDay + index);
  }

  get fixedCalendarGridTemplate(): string {
    return `72px repeat(${this.visibleFixedDays.length}, minmax(132px, 1fr))`;
  }

  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private schemesService: EvaluationSchemesService,
    private assessmentAdministrationService: AssessmentAdministrationService,
    private departmentsService: DepartmentsService,
    private questionnaireService: QuestionnaireManagementService,
    private bundlesService: QuestionnaireBundlesService,
    private randomizationsService: RandomizationsService,
    private errorService: ErrorHandlerService,
    private contextMenuService: NzContextMenuService,
    private modalService: NzModalService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.baseForm.get('schemeType').valueChanges.subscribe(() => this.onSchemeTypeChange());
    this.baseForm.get('departmentIds').valueChanges.subscribe(() => {
      this.loadBundles();
      this.loadRandomizations();
      this.clearIncompatibleDraftSelections();
    });
    this.loadAssessmentTypes();
    this.loadBundles();
    this.loadRandomizations();
    this.loadDepartments();
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.currentSchemeId = id;
        this.loadSchemeById(id);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollFixedCalendarToMorning());
  }

  public saveBase(): void {
    if (!this.canPersistBaseScheme()) return;

    const wasNew = !this.currentSchemeId && !this.scheme?.id;
    this.saving = true;
    this.persistBaseScheme().then(
      (scheme: EvaluationScheme) => {
        this.scheme = scheme;
        this.currentSchemeId = scheme.id;
        if (wasNew) {
          this.router.navigate(['/psira/evaluation-schemes', scheme.id], { replaceUrl: true });
          return;
        }
        this.loadSchemeById(scheme.id);
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('evaluationSchemes.unableSaveScheme') })
    ).finally(() => (this.saving = false));
  }

  public onResourceKindChange(kind: ClinicalSessionResourceKind): void {
    this.selectedResourceKind = kind;
    if (kind === ClinicalSessionResourceKind.POST_ASSESSMENT) {
      this.sessionResourceForm.patchValue({
        activationOffsetMinutes: -5,
        availabilityDurationMinutes: 60,
      });
      return;
    }

    this.sessionResourceForm.patchValue({
      activationOffsetMinutes: -15,
      availabilityDurationMinutes: 30,
    });
  }

  public addSessionResource(): void {
    if (!this.canSubmitSessionResource()) return;

    if (!this.scheme?.id) {
      this.upsertDraftSessionResource();
      this.resetSessionResourceForm();
      return;
    }

    this.saving = true;
    this.ensureSessionRuleTemplate()
      .then((sessionTemplate) => {
        this.attachSessionTemplateToCurrentScheme(sessionTemplate);
        return this.editingResourceId
          ? this.schemesService
              .updateResourceTemplate({
                id: this.editingResourceId,
                ...this.buildResourceTemplatePayload(),
              })
              .toPromise()
          : this.schemesService
              .addResourceTemplate({
                sessionTemplateId: sessionTemplate.id,
                ...this.buildResourceTemplatePayload(),
              })
              .toPromise();
      })
      .then((resource) => {
        this.attachResourceToCurrentScheme(resource);
        this.resetSessionResourceForm();
      })
      .catch((error) => this.errorService.handleError(error, { prefix: this.translate.instant('evaluationSchemes.unableAddSessionRule') }))
      .finally(() => (this.saving = false));
  }

  public editSessionResource(resource: any): void {
    this.editingResourceId = resource.id;
    this.selectedResourceKind = resource.resourceKind;
    this.sessionResourceForm.patchValue({
      resourceKind: resource.resourceKind,
      assessmentTypeId: resource.assessmentTypeId,
      name: resource.name || null,
      contentType: this.inferContentType(resource),
      questionnaireId: resource.questionnaireIds?.[0] || null,
      questionnaireBundleId: resource.questionnaireBundleIds?.[0] || null,
      randomizationRuleId: resource.randomizationRuleIds?.[0] || null,
      sessionTargetMode: resource.sessionSelector ? SessionTargetMode.SPECIFIC : SessionTargetMode.FREQUENCY,
      sessionSelector: resource.sessionSelector || '',
      everyNSessions: resource.everyNSessions || null,
      startSessionNumber: resource.startSessionNumber || 1,
      endSessionNumber: resource.endSessionNumber || null,
      activationOffsetMinutes: resource.activationOffsetMinutes,
      availabilityDurationMinutes: this.minutesToUnitAmount(
        resource.availabilityDurationMinutes,
        resource.availabilityDurationUnit as TimeUnit
      ),
      availabilityDurationUnit: resource.availabilityDurationUnit || 'MINUTES',
      reminderMinutes: this.minutesListToUnitText(resource.reminderMinutes || [], resource.reminderUnit as TimeUnit),
      reminderUnit: resource.reminderUnit || 'MINUTES',
      responderRoles: this.parseResponderRoles(resource.defaultResponderRole),
    });
  }

  public openResourceContextMenu(event: MouseEvent, resource: any, menu: NzDropdownMenuComponent): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextResource = resource;
    this.contextMenuService.create(event, menu);
  }

  public deleteContextResource(): void {
    if (!this.contextResource) return;
    this.deleteSessionResource(this.contextResource);
  }

  public deleteSessionResource(resource: any): void {
    if (resource.id < 0) {
      this.draftSessionResources = this.draftSessionResources.filter((draftResource) => draftResource.id !== resource.id);
      if (this.editingResourceId === resource.id) this.resetSessionResourceForm();
      return;
    }

    if (!this.scheme?.id) return;
    const schemeId = this.scheme.id;
    this.modalService.confirm({
      nzTitle: this.translate.instant('evaluationSchemes.deleteSchemeAssessment'),
      nzContent: this.translate.instant('evaluationSchemes.deleteSessionRuleConfirm'),
      nzOkText: this.translate.instant('core.delete'),
      nzOkDanger: true,
      nzOnOk: () => {
        this.schemesService.deleteResourceTemplate(resource.id).subscribe(
          () => {
            if (this.editingResourceId === resource.id) this.resetSessionResourceForm();
            this.loadSchemeById(schemeId);
          },
          (error) => this.errorService.handleError(error, { prefix: this.translate.instant('evaluationSchemes.unableDeleteSessionRule') })
        );
      },
    });
  }

  public onContentTypeChange(form: FormGroup, type: AssessmentContentType): void {
    form.patchValue({
      contentType: type,
      questionnaireId: type === AssessmentContentType.QUESTIONNAIRE ? form.get('questionnaireId')?.value : null,
      questionnaireBundleId:
        type === AssessmentContentType.QUESTIONNAIRE_BUNDLE ? form.get('questionnaireBundleId')?.value : null,
      randomizationRuleId:
        type === AssessmentContentType.RANDOMIZATION ? form.get('randomizationRuleId')?.value : null,
    });
  }

  public onSessionTargetModeChange(mode: SessionTargetMode): void {
    if (mode === SessionTargetMode.SPECIFIC) {
      this.sessionResourceForm.patchValue({
        sessionSelector: '1',
        everyNSessions: null,
        startSessionNumber: 1,
        endSessionNumber: null,
      });
      return;
    }

    this.sessionResourceForm.patchValue({
      sessionSelector: '',
      everyNSessions: 4,
      startSessionNumber: 1,
      endSessionNumber: null,
    });
  }

  public sessionResources(): any[] {
    if (!this.scheme?.id) return this.draftSessionResources;

    return (this.scheme?.sessionTemplates || []).reduce(
      (resources: any[], sessionTemplate: any) => resources.concat(sessionTemplate.resourceTemplates || []),
      []
    );
  }

  private attachResourceToCurrentScheme(resource: any): void {
    if (!this.scheme || !resource) return;

    const sessionTemplates = this.scheme.sessionTemplates || [];
    const targetTemplate =
      sessionTemplates.find((sessionTemplate: any) => sessionTemplate.id === resource.sessionTemplateId) ||
      sessionTemplates[0];

    if (!targetTemplate) return;

    const resources = targetTemplate.resourceTemplates || [];
    targetTemplate.resourceTemplates = this.editingResourceId
      ? resources.map((existingResource: any) =>
          existingResource.id === resource.id ? resource : existingResource
        )
      : [...resources, resource];

    this.scheme = {
      ...this.scheme,
      sessionTemplates: [...sessionTemplates],
    };
  }

  private attachSessionTemplateToCurrentScheme(sessionTemplate: any): void {
    if (!this.scheme || !sessionTemplate) return;
    const sessionTemplates = this.scheme.sessionTemplates || [];
    if (sessionTemplates.some((existingTemplate: any) => existingTemplate.id === sessionTemplate.id)) return;

    this.scheme = {
      ...this.scheme,
      sessionTemplates: [
        ...sessionTemplates,
        {
          ...sessionTemplate,
          resourceTemplates: sessionTemplate.resourceTemplates || [],
        },
      ],
    };
  }

  public resourceTargetLabel(resource: any): string {
    if (resource.sessionSelector) return resource.sessionSelector;
    const start = resource.startSessionNumber || 1;
    const end = resource.endSessionNumber
      ? this.translate.instant('evaluationSchemes.toSessionShort', { session: resource.endSessionNumber })
      : '';
    return this.translate.instant('evaluationSchemes.everySessionsFrom', {
      every: resource.everyNSessions,
      start,
      end,
    });
  }

  public resourceContentLabel(resource: any): string {
    if (resource.name) return resource.name;
    const assessmentTypeName = this.assessmentTypes.find((type) => Number(type.id) === Number(resource.assessmentTypeId))?.name;
    if (assessmentTypeName) return assessmentTypeName;
    if (resource.questionnaireIds?.length) return `${this.translate.instant('questionnaires.questionnaire')}: ${resource.questionnaireIds[0]}`;
    if (resource.questionnaireBundleIds?.length) return `${this.translate.instant('questionnaireBundles.bundle')}: ${resource.questionnaireBundleIds[0]}`;
    if (resource.randomizationRuleIds?.length) return `${this.translate.instant('randomizations.randomization')}: ${this.randomizationName(resource.randomizationRuleIds[0])}`;
    return '-';
  }

  public resourceResponderLabel(resource: any): string {
    const roles = this.parseResponderRoles(resource.defaultResponderRole);
    if (!roles.length) return '-';
    return roles
      .map((role) => this.translate.instant(this.responderRoleOptions.find((option) => option.value === role)?.label || role))
      .join(', ');
  }

  public resourceStringSort(field: string): (a: any, b: any) => number {
    return (a, b) => this.compareText(a?.[field], b?.[field]);
  }

  public resourceNumberSort(field: string): (a: any, b: any) => number {
    return (a, b) => Number(a?.[field] || 0) - Number(b?.[field] || 0);
  }

  public resourceContentSort = (a: any, b: any): number =>
    this.compareText(this.resourceContentLabel(a), this.resourceContentLabel(b));

  public resourceTargetSort = (a: any, b: any): number =>
    this.compareText(this.resourceTargetLabel(a), this.resourceTargetLabel(b));

  public resourceDurationSort = (a: any, b: any): number =>
    Number(a?.availabilityDurationMinutes || 0) - Number(b?.availabilityDurationMinutes || 0);

  public resourceResponderSort = (a: any, b: any): number =>
    this.compareText(this.resourceResponderLabel(a), this.resourceResponderLabel(b));

  public resourceReminderSort = (a: any, b: any): number =>
    this.compareText(this.reminderLabel(a?.reminderMinutes, a?.reminderUnit), this.reminderLabel(b?.reminderMinutes, b?.reminderUnit));

  private compareText(a: any, b: any): number {
    return String(a || '').localeCompare(String(b || ''), undefined, { numeric: true, sensitivity: 'base' });
  }

  public openFixedSlotModal(day: number, minute: number, slot?: any): void {
    this.editingFixedSlotId = slot?.id;
    const endMinute = slot?.endMinuteOfDay || (minute + (slot?.durationMinutes || 60));
    this.fixedSlotForm.reset({
      assessmentTypeId: slot?.assessmentTypeId || null,
      name: slot?.name || null,
      contentType: this.inferContentType(slot),
      questionnaireId: slot?.questionnaireIds?.[0] || null,
      questionnaireBundleId: slot?.questionnaireBundleIds?.[0] || null,
      randomizationRuleId: slot?.randomizationRuleIds?.[0] || null,
      relativeDay: slot?.relativeDay === undefined ? day : slot.relativeDay,
      relativeMinuteOfDay: this.fixedSlotStartMinute(slot, minute),
      startTime: this.minuteToTimeValue(this.fixedSlotStartMinute(slot, minute)),
      endTime: this.minuteToTimeValue(endMinute),
      durationMinutes: slot?.durationMinutes || Math.max(15, endMinute - minute),
      endMinuteOfDay: endMinute,
      triggerMode: slot?.triggerMode || FixedTriggerMode.BLOCK_START,
      availabilityDurationMinutes: this.minutesToUnitAmount(
        slot?.availabilityDurationMinutes || 60,
        slot?.availabilityDurationUnit as TimeUnit
      ),
      availabilityDurationUnit: slot?.availabilityDurationUnit || 'MINUTES',
      reminderMinutes: this.minutesListToUnitText(slot?.reminderMinutes || [], slot?.reminderUnit as TimeUnit),
      reminderUnit: slot?.reminderUnit || 'MINUTES',
      required: !!slot?.required,
      singleResponse: slot?.singleResponse === undefined ? true : slot.singleResponse,
      seedOrder: slot?.seedOrder || 0,
      informantType: slot?.informantType || '',
      responderRoles: this.parseResponderRoles(slot?.defaultResponderRole),
    });
    this.fixedSlotModalVisible = true;
  }

  public closeFixedSlotModal(): void {
    this.fixedSlotModalVisible = false;
    this.editingFixedSlotId = undefined;
    this.resetFixedSlotForm();
  }

  public saveFixedSlot(): void {
    if (!this.canSubmitFixedSlot()) return;
    const payload = this.buildFixedSlotPayload();

    if (!this.scheme?.id) {
      const slot = {
        id: this.editingFixedSlotId || this.nextDraftFixedSlotId--,
        ...payload,
      };
      this.draftFixedSlots = this.editingFixedSlotId
        ? this.draftFixedSlots.map((draftSlot) => draftSlot.id === this.editingFixedSlotId ? slot : draftSlot)
        : [...this.draftFixedSlots, slot];
      this.closeFixedSlotModal();
      return;
    }

    const schemeId = this.scheme?.id;
    if (!schemeId) return;
    this.saving = true;
    const request = this.editingFixedSlotId
      ? this.schemesService.updateIndependentEvaluationTemplate({
          id: this.editingFixedSlotId,
          ...payload,
        })
      : this.schemesService.addIndependentEvaluationTemplate({
          schemeId,
          ...payload,
        });
    request
      .toPromise()
      .then(
        (slot) => {
          this.attachFixedSlotToCurrentScheme(slot);
          this.closeFixedSlotModal();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('evaluationSchemes.unableAddFixedSlot') })
      )
      .finally(() => (this.saving = false));
  }

  public selectQuarterSlot(day: number, hour: number, quarter: number): void {
    this.openFixedSlotModal(day, hour * 60 + quarter);
  }

  public fixedSlots(): any[] {
    return this.scheme?.id ? (this.scheme.independentEvaluationTemplates || []) : this.draftFixedSlots;
  }

  public slotStartsAt(day: number, minute: number): any[] {
    return this.fixedSlots().filter(
      (slot: any) => Number(slot.relativeDay) === day && this.fixedSlotStartMinute(slot) === minute
    );
  }

  public formatRelativeTime(slot: any): string {
    return `${this.formatAmPm(this.fixedSlotStartMinute(slot))} - ${this.formatAmPm(this.fixedSlotEndMinute(slot))}`;
  }

  public fixedSlotContentLabel(slot: any): string {
    if (slot.name) return slot.name;
    const assessmentTypeName = this.assessmentTypes.find((type) => Number(type.id) === Number(slot.assessmentTypeId))?.name;
    if (assessmentTypeName) return assessmentTypeName;
    if (slot.questionnaireIds?.length) return `${this.translate.instant('questionnaires.questionnaire')} ${slot.questionnaireIds[0]}`;
    if (slot.questionnaireBundleIds?.length) return `${this.translate.instant('questionnaireBundles.bundle')} ${slot.questionnaireBundleIds[0]}`;
    if (slot.randomizationRuleIds?.length) return `${this.translate.instant('randomizations.randomization')} ${this.randomizationName(slot.randomizationRuleIds[0])}`;
    return this.translate.instant('plannedAssessments.assessment');
  }

  public fixedSlotBlockHeight(slot: any): number {
    const duration = Math.max(15, Number(slot.durationMinutes || 60));
    return Math.max(10, Math.ceil(duration / 15) * 11 - 3);
  }

  public isNightHour(hour: number): boolean {
    return hour >= 22 || hour < 8;
  }

  public formatHourLabel(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  public fixedSlotDayTitle(): string {
    return `${this.translate.instant('time.day')} ${Number(this.fixedSlotForm.get('relativeDay')?.value || 0) + 1}`;
  }

  public openFixedSlotContextMenu(event: MouseEvent, slot: any, menu: NzDropdownMenuComponent): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextFixedSlot = slot;
    this.contextMenuService.create(event, menu);
  }

  public deleteContextFixedSlot(): void {
    if (!this.contextFixedSlot) return;
    this.deleteFixedSlot(this.contextFixedSlot);
  }

  public duplicateContextFixedSlot(): void {
    if (!this.contextFixedSlot) return;
    this.duplicateFixedSlot(this.contextFixedSlot);
  }

  public duplicateFixedSlot(slot: any): void {
    const startMinute = this.fixedSlotStartMinute(slot);
    const duration = Number(slot.durationMinutes || 60);
    const duplicatedStartMinute = startMinute + 15 + duration <= 24 * 60 ? startMinute + 15 : startMinute;
    const duplicate = {
      ...this.copyFixedSlotPayload(slot),
      relativeMinuteOfDay: duplicatedStartMinute,
      startMinuteOfDay: duplicatedStartMinute,
      endMinuteOfDay: Math.min(24 * 60, duplicatedStartMinute + duration),
    };
    this.persistFixedSlots([duplicate]);
  }

  public deleteFixedSlot(slot: any): void {
    if (slot.id < 0) {
      this.draftFixedSlots = this.draftFixedSlots.filter((draftSlot) => draftSlot.id !== slot.id);
      if (this.editingFixedSlotId === slot.id) this.closeFixedSlotModal();
      return;
    }

    if (!this.scheme?.id) return;
    this.schemesService.deleteIndependentEvaluationTemplate(slot.id).subscribe(
      () => {
        this.scheme = {
          ...this.scheme,
          independentEvaluationTemplates: (this.scheme?.independentEvaluationTemplates || []).filter(
            (existingSlot: any) => existingSlot.id !== slot.id
          ),
        };
        if (this.editingFixedSlotId === slot.id) this.closeFixedSlotModal();
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('evaluationSchemes.unableDeleteFixedSlot') })
    );
  }

  public clearFixedSlots(): void {
    if (!this.fixedSlots().length) return;
    this.modalService.confirm({
      nzTitle: this.translate.instant('evaluationSchemes.clearAllInteractions'),
      nzContent: this.translate.instant('evaluationSchemes.clearFixedScheduleConfirm'),
      nzOkText: this.translate.instant('core.clearAll'),
      nzOkDanger: true,
      nzOnOk: () => this.clearFixedSlotsNow(),
    });
  }

  public startFixedSlotDrag(event: DragEvent, slot: any): void {
    this.draggedFixedSlot = slot;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', String(slot.id));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  public allowFixedSlotDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  public dropFixedSlot(event: DragEvent, day: number, hour: number, quarter: number): void {
    event.preventDefault();
    event.stopPropagation();
    const slot = this.draggedFixedSlot;
    this.draggedFixedSlot = undefined;
    if (!slot) return;
    this.moveFixedSlot(slot, day, hour * 60 + quarter);
  }

  public resizeContextFixedSlot(deltaMinutes: number): void {
    if (!this.contextFixedSlot) return;
    this.resizeFixedSlot(this.contextFixedSlot, deltaMinutes);
  }

  public resizeFixedSlot(slot: any, deltaMinutes: number): void {
    const startMinute = this.fixedSlotStartMinute(slot);
    const requestedDuration = Math.max(15, Number(slot.durationMinutes || 60) + deltaMinutes);
    const endMinute = Math.min(24 * 60, startMinute + requestedDuration);
    const updated = {
      ...this.copyFixedSlotPayload(slot),
      durationMinutes: Math.max(15, endMinute - startMinute),
      endMinuteOfDay: endMinute,
    };
    this.updateFixedSlot(slot, updated);
  }

  public openRepeatRuleModal(): void {
    this.repeatRuleForm.reset({
      mode: FixedRepeatRuleMode.ADD_FROM_INTERACTION,
      assessmentTypeId: null,
      name: null,
      contentType: AssessmentContentType.QUESTIONNAIRE,
      questionnaireId: null,
      questionnaireBundleId: null,
      randomizationRuleId: null,
      preset: 'FIVE_PER_DAY',
      startingDay: 1,
      numberOfDays: 7,
      numberOfWeeks: 1,
      triggerMode: FixedTriggerMode.BLOCK_START,
      availabilityDurationMinutes: 60,
      availabilityDurationUnit: 'MINUTES',
      reminderMinutes: '',
      reminderUnit: 'MINUTES',
      required: false,
      singleResponse: true,
      responderRoles: [],
    });
    this.repeatRuleModalVisible = true;
  }

  public closeRepeatRuleModal(): void {
    this.repeatRuleModalVisible = false;
  }

  public applyRepeatRule(): void {
    const mode = this.repeatRuleForm.get('mode')?.value;
    let slots: any[] = [];

    if (mode === FixedRepeatRuleMode.ADD_FROM_INTERACTION) {
      if (!this.canApplyAddFromInteractionRule()) return;
      slots = this.buildAddFromInteractionSlots();
    }

    if (mode === FixedRepeatRuleMode.EXTEND_LAST_DAY) {
      slots = this.buildExtendLastDaySlots();
    }

    if (mode === FixedRepeatRuleMode.EXTEND_LAST_WEEK) {
      slots = this.buildExtendLastWeekSlots();
    }

    if (!slots.length) {
      this.modalService.warning({
        nzTitle: this.translate.instant('evaluationSchemes.noInteractionsToCreate'),
        nzContent: this.translate.instant('evaluationSchemes.reviewRuleOrDuration'),
        nzOkText: this.translate.instant('core.understood'),
      });
      return;
    }

    this.persistFixedSlots(slots, () => this.closeRepeatRuleModal());
  }

  public goToPreviousFixedWeek(): void {
    this.weekStartDay = Math.max(0, this.weekStartDay - this.fixedBlockSize);
  }

  public goToNextFixedWeek(): void {
    this.weekStartDay = Math.min((this.maxFixedWeeks - 1) * 7, this.weekStartDay + this.fixedBlockSize);
    if (this.weekStartDay + 7 > this.schemeDurationDays) {
      this.baseForm.patchValue({ durationDays: this.weekStartDay + 7 });
    }
  }

  public onDurationDaysChange(): void {
    this.weekStartDay = Math.min(this.weekStartDay, (this.maxFixedWeeks - 1) * 7);
  }

  public searchQuestionnaires(search: string): void {
    const filter = search ? { or: this.createQuestionnaireSearchFilter(search) } : undefined;
    this.questionnaireService.getQuestionnaires({ filter, departmentIds: this.selectedDepartmentIds() }).subscribe(
      ({ edges }) => {
        this.foundQuestionnaires = edges
          .map((edge: any) => edge.node)
          .filter(
            (questionnaire: QuestionnaireVersion) =>
              questionnaire.zombie === false &&
              [QuestionnaireStatus.PRIVATE, QuestionnaireStatus.PUBLISHED].includes(questionnaire.status) &&
              this.matchesSelectedDepartments(questionnaire.departmentIds)
          );
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('questionnaires.unableLoadQuestionnaires') })
    );
  }

  private loadSchemeById(id: number): void {
    this.currentSchemeId = id;
    const previousSessionResources = this.sessionResources();
    const previousFixedSlots = this.scheme?.independentEvaluationTemplates || this.draftFixedSlots;
    this.loading = true;
    this.schemesService
      .getSchemes({ filter: { id: { eq: id } } })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ edges }) => {
          const loadedScheme = edges[0]?.node;
          if (
            loadedScheme &&
            !this.sessionResourcesFromScheme(loadedScheme).length &&
            previousSessionResources.length
          ) {
            loadedScheme.sessionTemplates = [
              {
                id: loadedScheme.sessionTemplates?.[0]?.id || null,
                resourceTemplates: previousSessionResources,
              },
            ];
          }
          if (
            loadedScheme &&
            !loadedScheme.independentEvaluationTemplates?.length &&
            previousFixedSlots.length
          ) {
            loadedScheme.independentEvaluationTemplates = previousFixedSlots;
          }
          this.scheme = loadedScheme;
          if (!this.scheme) return;
          this.baseForm.patchValue({
            name: this.scheme.name,
            description: this.scheme.description,
            active: this.scheme.active,
            departmentIds: (this.scheme.departments || []).map((department: any) => department.id),
            durationDays: this.scheme.durationDays || 7,
            schemeType: this.scheme.schemeType,
          }, { emitEvent: false });
          this.baseForm.get('schemeType').disable();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('evaluationSchemes.unableLoadScheme') })
      );
  }

  private ensureSessionRuleTemplate(): Promise<any> {
    const existing = this.scheme?.sessionTemplates?.[0];
    if (existing) return Promise.resolve(existing);
    if (!this.scheme?.id) return Promise.reject(new Error(this.translate.instant('evaluationSchemes.schemeMustBeSavedFirst')));

    return this.schemesService
      .addSessionTemplate({
        schemeId: this.scheme.id,
        sessionKind: ClinicalSessionKind.CLINICAL,
        sessionIndex: 0,
        title: this.translate.instant('evaluationSchemes.sessionResources'),
        relativeOffsetDays: 0,
        durationMinutes: 60,
      })
      .toPromise();
  }

  public resetSessionResourceForm(): void {
    this.editingResourceId = undefined;
    this.sessionResourceForm.reset({
      resourceKind: ClinicalSessionResourceKind.PRE_ASSESSMENT,
      assessmentTypeId: null,
      name: null,
      questionnaireId: null,
      questionnaireBundleId: null,
      randomizationRuleId: null,
      contentType: AssessmentContentType.QUESTIONNAIRE,
      sessionTargetMode: SessionTargetMode.SPECIFIC,
      sessionSelector: '1',
      everyNSessions: null,
      startSessionNumber: 1,
      endSessionNumber: null,
      activationOffsetMinutes: -15,
      availabilityDurationMinutes: 30,
      availabilityDurationUnit: 'MINUTES',
      reminderMinutes: '',
      reminderUnit: 'MINUTES',
      responderRoles: [],
    });
  }

  private hasSessionTargetRule(): boolean {
    const value = this.sessionResourceForm.value;
    return value.sessionTargetMode === SessionTargetMode.SPECIFIC
      ? !!value.sessionSelector
      : !!value.everyNSessions;
  }

  private hasAssessmentContent(): boolean {
    const value = this.sessionResourceForm.value;
    return !!value.questionnaireId || !!value.questionnaireBundleId || !!value.randomizationRuleId;
  }

  private canSubmitSessionResource(): boolean {
    if (this.sessionResourceForm.invalid) {
      this.sessionResourceForm.markAllAsTouched();
      this.modalService.warning({
        nzTitle: this.translate.instant('evaluationSchemes.missingAssessmentData'),
        nzContent: this.translate.instant('evaluationSchemes.completeResourceAndAssessmentType'),
        nzOkText: this.translate.instant('core.understood'),
      });
      return false;
    }

    if (!this.hasAssessmentContent()) {
      this.modalService.warning({
        nzTitle: this.translate.instant('evaluationSchemes.missingQuestionnaireOrBundle'),
        nzContent: this.translate.instant('evaluationSchemes.chooseQuestionnaireOrBundle'),
        nzOkText: this.translate.instant('core.understood'),
      });
      return false;
    }

    if (!this.hasSessionTargetRule()) {
      this.modalService.warning({
        nzTitle: this.translate.instant('evaluationSchemes.missingSessionScheduling'),
        nzContent: this.translate.instant('evaluationSchemes.indicateSessionsOrFrequency'),
        nzOkText: this.translate.instant('core.understood'),
      });
      return false;
    }

    return true;
  }

  private buildResourceTemplatePayload(): any {
    const value = this.sessionResourceForm.value;
    const isSpecific = value.sessionTargetMode === SessionTargetMode.SPECIFIC;
    return {
      resourceKind: value.resourceKind,
      assessmentTypeId: value.assessmentTypeId,
      name: value.name?.trim() || null,
      questionnaireIds: value.questionnaireId ? [value.questionnaireId] : [],
      questionnaireBundleIds: value.questionnaireBundleId ? [value.questionnaireBundleId] : [],
      randomizationRuleIds: value.randomizationRuleId ? [value.randomizationRuleId] : [],
      sessionSelector: isSpecific ? value.sessionSelector : null,
      everyNSessions: isSpecific ? null : Number(value.everyNSessions),
      startSessionNumber: isSpecific ? null : Number(value.startSessionNumber || 1),
      endSessionNumber: isSpecific || !value.endSessionNumber ? null : Number(value.endSessionNumber),
      activationAnchor: this.activationAnchorForKind(value.resourceKind),
      activationOffsetMinutes: Number(value.activationOffsetMinutes || 0),
      availabilityDurationMinutes: this.unitAmountToMinutes(
        Number(value.availabilityDurationMinutes || 0),
        value.availabilityDurationUnit
      ),
      availabilityDurationUnit: value.availabilityDurationUnit || 'MINUTES',
      reminderMinutes: this.parseReminderMinutes(value.reminderMinutes, value.reminderUnit),
      reminderUnit: value.reminderUnit || 'MINUTES',
      defaultResponderRole: (value.responderRoles || []).join(','),
    };
  }

  private upsertDraftSessionResource(): void {
    const payload = this.buildResourceTemplatePayload();
    const resource = {
      ...payload,
      id: this.editingResourceId || this.nextDraftResourceId--,
      sessionTemplateId: null,
    };

    this.draftSessionResources = this.editingResourceId
      ? this.draftSessionResources.map((draftResource) =>
          draftResource.id === this.editingResourceId ? resource : draftResource
        )
      : [...this.draftSessionResources, resource];
  }

  private activationAnchorForKind(kind: ClinicalSessionResourceKind): ResourceActivationAnchor {
    return kind === ClinicalSessionResourceKind.POST_ASSESSMENT
      ? ResourceActivationAnchor.SESSION_END
      : ResourceActivationAnchor.SESSION_START;
  }

  private parseReminderMinutes(value: string, unit: TimeUnit = 'MINUTES'): number[] {
    return (value || '')
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((part) => Number.isFinite(part) && part >= 0)
      .map((part) => this.unitAmountToMinutes(part, unit));
  }

  public durationLabel(minutes: number, unit: TimeUnit = 'MINUTES'): string {
    const displayUnit = unit || 'MINUTES';
    return `${this.minutesToUnitAmount(minutes, displayUnit)} ${this.timeUnitLabel(displayUnit)}`;
  }

  public reminderLabel(minutes: number[] = [], unit: TimeUnit = 'MINUTES'): string {
    if (!minutes?.length) return '-';
    return `${this.minutesListToUnitText(minutes, unit)} ${this.timeUnitLabel(unit || 'MINUTES')}`;
  }

  private timeUnitLabel(unit: TimeUnit): string {
    return this.timeUnits.find((item) => item.value === unit)?.label.toLowerCase() || 'minutos';
  }

  private unitAmountToMinutes(value: number, unit: TimeUnit = 'MINUTES'): number {
    const amount = Number(value || 0);
    switch (unit || 'MINUTES') {
      case 'HOURS':
        return amount * 60;
      case 'DAYS':
        return amount * 24 * 60;
      case 'WEEKS':
        return amount * 7 * 24 * 60;
      case 'MONTHS':
        return amount * 30 * 24 * 60;
      default:
        return amount;
    }
  }

  private minutesToUnitAmount(minutes: number, unit: TimeUnit = 'MINUTES'): number {
    const value = Number(minutes || 0);
    switch (unit || 'MINUTES') {
      case 'HOURS':
        return value / 60;
      case 'DAYS':
        return value / (24 * 60);
      case 'WEEKS':
        return value / (7 * 24 * 60);
      case 'MONTHS':
        return value / (30 * 24 * 60);
      default:
        return value;
    }
  }

  private minutesListToUnitText(minutes: number[] = [], unit: TimeUnit = 'MINUTES'): string {
    return (minutes || [])
      .map((minute) => this.minutesToUnitAmount(minute, unit || 'MINUTES'))
      .join(', ');
  }

  private parseResponderRoles(value?: string): string[] {
    return (value || '')
      .split(',')
      .map((role) => role.trim())
      .filter((role) => !!role);
  }

  private loadRandomizations(): void {
    this.randomizationsService
      .getRandomizations({
        paging: { first: 50 },
        departmentIds: this.selectedDepartmentIds(),
        filter: {
          type: { eq: RandomizationRuleType.LOW_LEVEL },
        },
      })
      .subscribe(
        ({ edges }) => {
          this.randomizations = edges
            .map((edge: any) => edge.node)
            .filter(
              (rule: RandomizationRule) =>
                rule.active &&
                this.matchesSelectedDepartments((rule.departments || []).map((department: any) => department.id))
            );
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('randomizations.unableLoadRandomizations') })
      );
  }

  private randomizationName(id: number): string {
    return this.randomizations.find((randomization) => randomization.id === id)?.name || String(id);
  }

  private inferContentType(item: any): AssessmentContentType {
    if (item?.randomizationRuleIds?.length) return AssessmentContentType.RANDOMIZATION;
    if (item?.questionnaireBundleIds?.length) return AssessmentContentType.QUESTIONNAIRE_BUNDLE;
    return AssessmentContentType.QUESTIONNAIRE;
  }

  private persistBaseScheme(): Promise<EvaluationScheme> {
    const value = this.baseForm.getRawValue();
    const { schemeType: _schemeType, ...updateValue } = value;
    const existingId = this.scheme?.id || this.currentSchemeId;
    if (existingId) {
      return this.schemesService.updateScheme({ id: existingId, ...updateValue }).toPromise();
    }

    return this.schemesService
      .createScheme({
        ...value,
        defaultDurationMinutes: 60,
        defaultRecurrenceRule: undefined,
        sessionTemplates: this.isSessionBased && this.draftSessionResources.length
          ? [
              {
                sessionKind: ClinicalSessionKind.CLINICAL,
                sessionIndex: 0,
          title: this.translate.instant('evaluationSchemes.sessionResources'),
                relativeOffsetDays: 0,
                durationMinutes: 60,
                resourceTemplates: this.draftSessionResources.map(({ id, sessionTemplateId, ...resource }) => resource),
              },
            ]
          : [],
        independentEvaluationTemplates: this.isFixedScheme
          ? this.draftFixedSlots.map(({ id, ...slot }) => slot)
          : [],
      })
      .toPromise()
      .then((scheme: EvaluationScheme) => {
        this.currentSchemeId = scheme.id;
        if (this.sessionResourcesFromScheme(scheme).length || !this.draftSessionResources.length) {
          this.draftSessionResources = [];
        }
        if (scheme.independentEvaluationTemplates?.length || !this.draftFixedSlots.length) {
          this.draftFixedSlots = [];
        }
        return scheme;
      });
  }

  private onSchemeTypeChange(): void {
    if (this.currentSchemeId || this.scheme?.id) return;
    this.scheme = undefined;
    this.draftSessionResources = [];
    this.draftFixedSlots = [];
    this.nextDraftResourceId = -1;
    this.nextDraftFixedSlotId = -1;
    this.resetSessionResourceForm();
    this.resetFixedSlotForm();
  }

  private sessionResourcesFromScheme(scheme: EvaluationScheme): any[] {
    return (scheme.sessionTemplates || []).reduce(
      (resources: any[], sessionTemplate: any) => resources.concat(sessionTemplate.resourceTemplates || []),
      []
    );
  }

  private canPersistBaseScheme(): boolean {
    if (this.baseForm.valid) return true;

    this.baseForm.markAllAsTouched();
    this.modalService.warning({
      nzTitle: this.translate.instant('evaluationSchemes.missingSchemeData'),
      nzContent: this.translate.instant('evaluationSchemes.completeSchemeNameAndType'),
      nzOkText: this.translate.instant('core.understood'),
    });
    return false;
  }

  private resetFixedSlotForm(): void {
    this.fixedSlotForm.reset({
      assessmentTypeId: null,
      name: null,
      questionnaireId: null,
      questionnaireBundleId: null,
      randomizationRuleId: null,
      contentType: AssessmentContentType.QUESTIONNAIRE,
      relativeDay: 0,
      relativeMinuteOfDay: 9 * 60,
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes: 60,
      endMinuteOfDay: 10 * 60,
      triggerMode: FixedTriggerMode.BLOCK_START,
      availabilityDurationMinutes: 60,
      availabilityDurationUnit: 'MINUTES',
      reminderMinutes: '',
      reminderUnit: 'MINUTES',
      required: false,
      singleResponse: true,
      seedOrder: 0,
      informantType: '',
      responderRoles: [],
    });
  }

  private clearFixedSlotsNow(): void {
    if (!this.scheme?.id) {
      this.draftFixedSlots = [];
      return;
    }

    this.saving = true;
    this.schemesService.clearIndependentEvaluationTemplates(this.scheme.id)
      .toPromise()
      .then(() => {
        this.scheme = {
          ...this.scheme,
          independentEvaluationTemplates: [],
        };
      })
      .catch((error) => this.errorService.handleError(error, { prefix: this.translate.instant('evaluationSchemes.unableClearFixedSlots') }))
      .finally(() => (this.saving = false));
  }

  private moveFixedSlot(slot: any, relativeDay: number, relativeMinuteOfDay: number): void {
    const duration = Number(slot.durationMinutes || 60);
    const payload = {
      ...this.copyFixedSlotPayload(slot),
      relativeDay,
      relativeMinuteOfDay,
      startMinuteOfDay: relativeMinuteOfDay,
      endMinuteOfDay: Math.min(24 * 60, relativeMinuteOfDay + duration),
      durationMinutes: Math.min(duration, 24 * 60 - relativeMinuteOfDay),
    };
    this.updateFixedSlot(slot, payload);
  }

  private updateFixedSlot(slot: any, payload: any): void {
    if (slot.id < 0 || !this.scheme?.id) {
      const updated = { ...payload, id: slot.id };
      this.draftFixedSlots = this.draftFixedSlots.map((draftSlot) => draftSlot.id === slot.id ? updated : draftSlot);
      return;
    }

    this.saving = true;
    this.schemesService.updateIndependentEvaluationTemplate({ id: slot.id, ...payload }).subscribe(
      (updatedSlot) => {
        this.attachUpdatedFixedSlot(updatedSlot);
        this.saving = false;
      },
      (error) => {
        this.saving = false;
        this.errorService.handleError(error, { prefix: this.translate.instant('evaluationSchemes.unableUpdateFixedSlot') });
      }
    );
  }

  private ensureDurationCoversSlots(slots: any[]): void {
    if (!slots.length) return;
    const neededDuration = Math.max(this.schemeDurationDays, ...slots.map((slot) => Number(slot.relativeDay || 0) + 1));
    if (neededDuration > this.schemeDurationDays) {
      this.baseForm.patchValue({ durationDays: neededDuration });
      this.onDurationDaysChange();
    }
  }

  private scrollFixedCalendarToMorning(): void {
    const calendar = document.querySelector('.relative-calendar') as HTMLElement;
    if (!calendar) return;
    const hourLabel = calendar.querySelector('.hour-label') as HTMLElement;
    const hourHeight = hourLabel?.offsetHeight || 44;
    calendar.scrollTop = 6 * hourHeight;
  }

  private persistDurationIfSaved(): Promise<void> {
    if (!this.scheme?.id) return Promise.resolve();
    return this.schemesService
      .updateScheme({
        id: this.scheme.id,
        durationDays: this.schemeDurationDays,
      })
      .toPromise()
      .then((scheme) => {
        this.scheme = {
          ...this.scheme,
          durationDays: scheme.durationDays,
        };
      });
  }

  private persistFixedSlots(slots: any[], onDone?: () => void): void {
    if (!slots.length) {
      if (onDone) onDone();
      return;
    }

    this.ensureDurationCoversSlots(slots);

    if (!this.scheme?.id) {
      const createdSlots = slots.map((slot) => ({
        ...slot,
        id: this.nextDraftFixedSlotId--,
      }));
      this.draftFixedSlots = [...this.draftFixedSlots, ...createdSlots];
      if (onDone) onDone();
      return;
    }

    this.saving = true;
    const schemeId = this.scheme.id;
    this.persistDurationIfSaved()
      .then(() => Promise.all(
        slots.map((slot) =>
          this.schemesService.addIndependentEvaluationTemplate({
            schemeId,
            ...slot,
          }).toPromise()
        )
      ))
      .then((createdSlots) => {
        this.scheme = {
          ...this.scheme,
          independentEvaluationTemplates: [
            ...(this.scheme?.independentEvaluationTemplates || []),
            ...createdSlots,
          ],
        };
        if (onDone) onDone();
      })
      .catch((error) => this.errorService.handleError(error, { prefix: this.translate.instant('evaluationSchemes.unableApplyFixedRule') }))
      .finally(() => (this.saving = false));
  }

  private attachUpdatedFixedSlot(slot: any): void {
    if (!this.scheme || !slot) return;
    this.scheme = {
      ...this.scheme,
      independentEvaluationTemplates: (this.scheme.independentEvaluationTemplates || []).map((existingSlot: any) =>
        existingSlot.id === slot.id ? slot : existingSlot
      ),
    };
  }

  private copyFixedSlotPayload(slot: any): any {
    return {
      assessmentTypeId: slot.assessmentTypeId,
      name: slot.name || null,
      questionnaireIds: slot.questionnaireIds || [],
      questionnaireBundleIds: slot.questionnaireBundleIds || [],
      randomizationRuleIds: slot.randomizationRuleIds || [],
      relativeDay: Number(slot.relativeDay || 0),
      relativeMinuteOfDay: this.fixedSlotStartMinute(slot),
      startMinuteOfDay: this.fixedSlotStartMinute(slot),
      durationMinutes: Number(slot.durationMinutes || 60),
      endMinuteOfDay: this.fixedSlotEndMinute(slot),
      triggerMode: slot.triggerMode || FixedTriggerMode.BLOCK_START,
      availabilityDurationMinutes: Number(slot.availabilityDurationMinutes || 60),
      availabilityDurationUnit: slot.availabilityDurationUnit || 'MINUTES',
      reminderMinutes: slot.reminderMinutes || [],
      reminderUnit: slot.reminderUnit || 'MINUTES',
      required: !!slot.required,
      singleResponse: slot.singleResponse === undefined ? true : !!slot.singleResponse,
      seedOrder: Number(slot.seedOrder || 0),
      informantType: slot.informantType || '',
      defaultResponderRole: slot.defaultResponderRole,
    };
  }

  private canApplyAddFromInteractionRule(): boolean {
    const value = this.repeatRuleForm.value;
    if (!value.assessmentTypeId || (!value.questionnaireId && !value.questionnaireBundleId && !value.randomizationRuleId)) {
      this.modalService.warning({
        nzTitle: this.translate.instant('evaluationSchemes.missingRuleData'),
        nzContent: this.translate.instant('evaluationSchemes.chooseAssessmentTypeAndContent'),
        nzOkText: this.translate.instant('core.understood'),
      });
      return false;
    }
    return true;
  }

  private buildAddFromInteractionSlots(): any[] {
    const value = this.repeatRuleForm.value;
    const startingDay = Math.max(0, Number(value.startingDay || 1) - 1);
    const numberOfDays = Math.max(1, Number(value.numberOfDays || 1));
    const slots: any[] = [];

    for (let day = startingDay; day < startingDay + numberOfDays; day++) {
      this.presetMinutes(value.preset).forEach((minute, index) => {
        slots.push({
          assessmentTypeId: value.assessmentTypeId,
          name: value.name?.trim() || null,
          questionnaireIds: value.questionnaireId ? [value.questionnaireId] : [],
          questionnaireBundleIds: value.questionnaireBundleId ? [value.questionnaireBundleId] : [],
          randomizationRuleIds: value.randomizationRuleId ? [value.randomizationRuleId] : [],
          relativeDay: day,
          relativeMinuteOfDay: minute,
          startMinuteOfDay: minute,
          durationMinutes: 60,
          endMinuteOfDay: Math.min(24 * 60, minute + 60),
          triggerMode: value.triggerMode || FixedTriggerMode.BLOCK_START,
          availabilityDurationMinutes: this.unitAmountToMinutes(
            Number(value.availabilityDurationMinutes || 60),
            value.availabilityDurationUnit
          ),
          availabilityDurationUnit: value.availabilityDurationUnit || 'MINUTES',
          reminderMinutes: this.parseReminderMinutes(value.reminderMinutes, value.reminderUnit),
          reminderUnit: value.reminderUnit || 'MINUTES',
          required: !!value.required,
          singleResponse: value.singleResponse === undefined ? true : !!value.singleResponse,
          seedOrder: index,
          informantType: '',
          defaultResponderRole: (value.responderRoles || []).join(','),
        });
      });
    }

    return slots;
  }

  private buildExtendLastDaySlots(): any[] {
    const lastDay = this.lastProgrammedDay();
    if (lastDay === null) return [];
    const daysToExtend = Math.max(1, Number(this.repeatRuleForm.get('numberOfDays')?.value || 1));
    const sourceSlots = this.fixedSlots().filter((slot) => Number(slot.relativeDay) === lastDay);
    const slots: any[] = [];

    for (let offset = 1; offset <= daysToExtend; offset++) {
      const targetDay = lastDay + offset;
      sourceSlots.forEach((slot) => {
        slots.push({
          ...this.copyFixedSlotPayload(slot),
          relativeDay: targetDay,
        });
      });
    }

    return slots;
  }

  private buildExtendLastWeekSlots(): any[] {
    const lastDay = this.lastProgrammedDay();
    if (lastDay === null) return [];
    const weeksToExtend = Math.max(1, Number(this.repeatRuleForm.get('numberOfWeeks')?.value || 1));
    const weekStart = Math.max(0, lastDay - 6);
    const sourceSlots = this.fixedSlots().filter((slot) => {
      const day = Number(slot.relativeDay);
      return day >= weekStart && day <= lastDay;
    });
    const slots: any[] = [];

    for (let week = 1; week <= weeksToExtend; week++) {
      sourceSlots.forEach((slot) => {
        const targetDay = Number(slot.relativeDay) + week * 7;
        slots.push({
          ...this.copyFixedSlotPayload(slot),
          relativeDay: targetDay,
        });
      });
    }

    return slots;
  }

  private lastProgrammedDay(): number | null {
    if (!this.fixedSlots().length) return null;
    return Math.max(...this.fixedSlots().map((slot) => Number(slot.relativeDay || 0)));
  }

  private presetMinutes(preset: string): number[] {
    const hour = (value: number) => value * 60;
    const presets: Record<string, number[]> = {
      FIVE_PER_DAY: [hour(9), hour(12), hour(15), hour(18), hour(21)],
      SEVEN_PER_DAY: [hour(8), hour(10), hour(12), hour(14), hour(16), hour(18), hour(20)],
      TEN_PER_DAY: [hour(8), hour(9), hour(10), hour(11), hour(12), hour(13), hour(14), hour(15), hour(16), hour(17)],
      MORNING_NOTIFICATION: [hour(9)],
      NIGHT_NOTIFICATION: [hour(21)],
    };
    return presets[preset] || presets.FIVE_PER_DAY;
  }

  private canSubmitFixedSlot(): boolean {
    this.syncFixedSlotTimes();
    if (this.fixedSlotForm.invalid) {
      this.fixedSlotForm.markAllAsTouched();
      this.modalService.warning({
        nzTitle: this.translate.instant('evaluationSchemes.missingInteractionData'),
        nzContent: this.translate.instant('evaluationSchemes.completeAssessmentTypeAndTimeBlock'),
        nzOkText: this.translate.instant('core.understood'),
      });
      return false;
    }

    const value = this.fixedSlotForm.value;
    if (!value.questionnaireId && !value.questionnaireBundleId && !value.randomizationRuleId) {
      this.modalService.warning({
        nzTitle: this.translate.instant('evaluationSchemes.missingQuestionnaireOrBundle'),
        nzContent: this.translate.instant('evaluationSchemes.chooseContentForInteraction'),
        nzOkText: this.translate.instant('core.understood'),
      });
      return false;
    }

    if (Number(value.endMinuteOfDay) <= Number(value.relativeMinuteOfDay)) {
      this.modalService.warning({
        nzTitle: this.translate.instant('evaluationSchemes.invalidTimeBlock'),
        nzContent: this.translate.instant('evaluationSchemes.endTimeAfterStartTime'),
        nzOkText: this.translate.instant('core.understood'),
      });
      return false;
    }

    if (Number(value.relativeDay) < 0 || Number(value.relativeDay) >= this.schemeDurationDays) {
      this.modalService.warning({
        nzTitle: this.translate.instant('evaluationSchemes.dayOutsideScheme'),
        nzContent: this.translate.instant('evaluationSchemes.relativeDayInsideDuration'),
        nzOkText: this.translate.instant('core.understood'),
      });
      return false;
    }

    return true;
  }

  private buildFixedSlotPayload(): any {
    this.syncFixedSlotTimes();
    const value = this.fixedSlotForm.value;
    return {
      assessmentTypeId: value.assessmentTypeId,
      name: value.name?.trim() || null,
      questionnaireIds: value.questionnaireId ? [value.questionnaireId] : [],
      questionnaireBundleIds: value.questionnaireBundleId ? [value.questionnaireBundleId] : [],
      randomizationRuleIds: value.randomizationRuleId ? [value.randomizationRuleId] : [],
      relativeDay: Number(value.relativeDay || 0),
      relativeMinuteOfDay: Number(value.relativeMinuteOfDay || 0),
      startMinuteOfDay: Number(value.relativeMinuteOfDay || 0),
      durationMinutes: Number(value.durationMinutes || 60),
      endMinuteOfDay: Number(value.endMinuteOfDay || 0),
      triggerMode: value.triggerMode || FixedTriggerMode.BLOCK_START,
      availabilityDurationMinutes: this.unitAmountToMinutes(
        Number(value.availabilityDurationMinutes || 60),
        value.availabilityDurationUnit
      ),
      availabilityDurationUnit: value.availabilityDurationUnit || 'MINUTES',
      reminderMinutes: this.parseReminderMinutes(value.reminderMinutes, value.reminderUnit),
      reminderUnit: value.reminderUnit || 'MINUTES',
      required: !!value.required,
      singleResponse: value.singleResponse === undefined ? true : !!value.singleResponse,
      seedOrder: Number(value.seedOrder || 0),
      informantType: value.informantType || '',
      defaultResponderRole: (value.responderRoles || []).join(','),
    };
  }

  private syncFixedSlotTimes(): void {
    const startMinute = this.timeValueToMinute(this.fixedSlotForm.get('startTime')?.value);
    const endMinute = this.timeValueToMinute(this.fixedSlotForm.get('endTime')?.value);
    this.fixedSlotForm.patchValue({
      relativeMinuteOfDay: startMinute,
      startMinuteOfDay: startMinute,
      endMinuteOfDay: endMinute,
      durationMinutes: Math.max(15, endMinute - startMinute),
    }, { emitEvent: false });
  }

  private attachFixedSlotToCurrentScheme(slot: any): void {
    if (!this.scheme || !slot) return;
    const slots = this.scheme.independentEvaluationTemplates || [];
    this.scheme = {
      ...this.scheme,
      independentEvaluationTemplates: this.editingFixedSlotId
        ? slots.map((existingSlot: any) => existingSlot.id === slot.id ? slot : existingSlot)
        : [...slots, slot],
    };
  }

  private fixedSlotEndMinute(slot: any): number {
    return slot.endMinuteOfDay || (this.fixedSlotStartMinute(slot) + Number(slot.durationMinutes || 60));
  }

  private fixedSlotStartMinute(slot: any, fallback = 0): number {
    if (!slot) return fallback;
    return slot.startMinuteOfDay === undefined || slot.startMinuteOfDay === null
      ? Number(slot.relativeMinuteOfDay === undefined ? fallback : slot.relativeMinuteOfDay)
      : Number(slot.startMinuteOfDay);
  }

  private minuteToTimeValue(totalMinutes: number): string {
    const bounded = Math.max(0, Math.min(23 * 60 + 59, Number(totalMinutes || 0)));
    const hour = Math.floor(bounded / 60);
    const minute = bounded % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  private timeValueToMinute(value: string): number {
    const [hour, minute] = (value || '00:00').split(':').map((part) => Number(part));
    return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
  }

  private formatAmPm(totalMinutes: number): string {
    const hour24 = Math.floor(Number(totalMinutes || 0) / 60);
    const minute = Number(totalMinutes || 0) % 60;
    const suffix = hour24 >= 12 ? 'P.M.' : 'A.M.';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${suffix}`;
  }

  private loadAssessmentTypes(): void {
    this.assessmentAdministrationService.assessmentActive().subscribe(
      ({ data }: any) => (this.assessmentTypes = data.activeAssessmentTypes || []),
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('plannedAssessments.unableLoadAssessmentTypes') })
    );
  }

  private loadBundles(): void {
    this.bundlesService.getQuestionnairesBundles({ departmentIds: this.selectedDepartmentIds() } as any).subscribe(
      ({ data }: any) => {
        this.questionnaireBundles = data.getQuestionnaireBundles.edges
          .map((edge: any) => edge.node)
          .filter((bundle: any) => this.matchesSelectedDepartments(bundle.departmentIds));
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableLoadQuestionnaireBundles') })
    );
  }

  private loadDepartments(): void {
    this.departmentsService.departments({ paging: { first: 50 }, filter: {}, sorting: [] }).subscribe(
      ({ data }: any) => {
        this.departments = this.filterAllowedDepartments(data.departments.edges.map((edge: any) => edge.node));
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('departments.unableLoadDepartments') })
    );
  }

  selectAllDepartments(): void {
    this.baseForm.patchValue({
      departmentIds: this.departments.map((department: any) => department.id),
    });
  }

  removeDepartments(): void {
    this.baseForm.patchValue({ departmentIds: [] });
  }

  private selectedDepartmentIds(): number[] {
    return this.baseForm.get('departmentIds')?.value || [];
  }

  private matchesSelectedDepartments(itemDepartmentIds: number[] = []): boolean {
    const departmentIds = this.selectedDepartmentIds();
    if (!departmentIds.length || !itemDepartmentIds?.length) return true;
    const itemIds = itemDepartmentIds.map(Number);
    return departmentIds.every((departmentId) => itemIds.includes(Number(departmentId)));
  }

  private clearIncompatibleDraftSelections(): void {
    [this.sessionResourceForm, this.fixedSlotForm, this.repeatRuleForm].forEach((form) => {
      const questionnaireId = form.get('questionnaireId')?.value;
      if (questionnaireId && !this.foundQuestionnaires.some((questionnaire) => questionnaire._id === questionnaireId)) {
        form.patchValue({ questionnaireId: null }, { emitEvent: false });
      }
      const bundleId = form.get('questionnaireBundleId')?.value;
      if (bundleId && !this.questionnaireBundles.some((bundle: any) => bundle._id === bundleId)) {
        form.patchValue({ questionnaireBundleId: null }, { emitEvent: false });
      }
      const randomizationId = form.get('randomizationRuleId')?.value;
      if (randomizationId && !this.randomizations.some((randomization) => randomization.id === randomizationId)) {
        form.patchValue({ randomizationRuleId: null }, { emitEvent: false });
      }
    });
  }

  private filterAllowedDepartments(departments: any[]): any[] {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const canSeeAll = user?.isSuperUser ||
      user?.roles?.some((role: any) => role.isSuperAdmin || role.code === 'SUPER_ADMIN') ||
      user?.permissions?.some((permission: any) => ['users.edit.all', 'assessments.assign.all'].includes(permission.name)) ||
      user?.roles?.some((role: any) =>
        role.permissions?.some((permission: any) => ['users.edit.all', 'assessments.assign.all'].includes(permission.name))
      );
    if (canSeeAll) return departments;
    const allowedIds = (user?.departments || []).map((department: any) => Number(department.id));
    return departments.filter((department: any) => allowedIds.includes(Number(department.id)));
  }

  private createQuestionnaireSearchFilter(searchString: string): any[] {
    return [
      { name: { iLike: `%${searchString}%` } },
      { abbreviation: { iLike: `%${searchString}%` } },
      { keywords: { iLike: `%${searchString}%` } },
    ];
  }
}
