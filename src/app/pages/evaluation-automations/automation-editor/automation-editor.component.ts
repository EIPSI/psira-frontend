import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AssessmentAdministrationService } from '@app/pages/administration/@services/assessment-administration.service';
import { Department } from '@app/pages/administration/@types/department';
import { Role } from '@app/pages/administration/@types/role';
import { EvaluationSchemesService } from '@app/pages/evaluation-schemes/@services/evaluation-schemes.service';
import { EvaluationScheme, EvaluationSchemeType } from '@app/pages/evaluation-schemes/@types/evaluation-scheme';
import { QuestionnaireBundlesService } from '@app/pages/questionnaire-management/@services/questionnaire-bundles.service';
import { QuestionnaireManagementService } from '@app/pages/questionnaire-management/@services/questionnaire-management.service';
import { QuestionnaireVersion } from '@app/pages/questionnaire-management/@types/questionnaire';
import { RandomizationsService } from '@app/pages/randomizations/@services/randomizations.service';
import { RandomizationRule, RandomizationRuleType } from '@app/pages/randomizations/@types/randomization';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin, Observable, of } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';
import { EvaluationAutomationsService } from '../@services/evaluation-automations.service';
import {
  CaseEventReason,
  CaseEventReasonContext,
  EvaluationAutomation,
  EvaluationAutomationConditionOperatorLabel,
  EvaluationAutomationConditionOperator,
  EvaluationAutomationContentType,
  EvaluationAutomationDelayUnit,
  EvaluationAutomationTriggerPoint,
  EvaluationAutomationTriggerPointLabel,
  EvaluationAutomationType,
  EvaluationAutomationTypeLabel,
} from '../@types/evaluation-automation';

type TriggerReasonScope = 'CLINICAL' | 'SUPERVISION';
type TimeUnit = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
type FixedAutomationSelectionType = 'SCHEME' | 'HIGH_LEVEL_RANDOMIZATION';

interface TriggerReasonGroup {
  label: string;
  reasons: CaseEventReason[];
}

@Component({
  selector: 'app-automation-editor',
  templateUrl: './automation-editor.component.html',
  styleUrls: ['./automation-editor.component.scss'],
})
export class AutomationEditorComponent implements OnInit {
  public form: FormGroup;
  public loading = false;
  public saving = false;
  public automationId?: number;
  public departments: Department[] = [];
  public roles: Role[] = [];
  public schemes: EvaluationScheme[] = [];
  public assessmentTypes: any[] = [];
  public questionnaires: QuestionnaireVersion[] = [];
  public bundles: any[] = [];
  public randomizations: RandomizationRule[] = [];
  public highLevelRandomizations: RandomizationRule[] = [];
  public contentType = EvaluationAutomationContentType.QUESTIONNAIRE;
  public triggerReasonOptions: CaseEventReason[] = [];
  public triggerReasonGroups: TriggerReasonGroup[] = [];

  public triggerPoints = Object.values(EvaluationAutomationTriggerPoint);
  public triggerPointLabel = EvaluationAutomationTriggerPointLabel;
  public automationTypes = Object.values(EvaluationAutomationType);
  public automationTypeLabel = EvaluationAutomationTypeLabel;
  public delayUnits = Object.values(EvaluationAutomationDelayUnit);
  public conditionOperators = Object.values(EvaluationAutomationConditionOperator);
  public conditionOperatorLabel = EvaluationAutomationConditionOperatorLabel;
  public delayUnitLabel: Record<EvaluationAutomationDelayUnit, string> = {
    [EvaluationAutomationDelayUnit.MINUTES]: 'Minutos',
    [EvaluationAutomationDelayUnit.HOURS]: 'Horas',
    [EvaluationAutomationDelayUnit.DAYS]: 'Días',
    [EvaluationAutomationDelayUnit.WEEKS]: 'Semanas',
    [EvaluationAutomationDelayUnit.MONTHS]: 'Meses',
    [EvaluationAutomationDelayUnit.YEARS]: 'Años',
  };
  public EAT = EvaluationAutomationType;
  public EACT = EvaluationAutomationContentType;
  public fixedSelectionTypes: Array<{ value: FixedAutomationSelectionType; label: string }> = [
    { value: 'SCHEME', label: 'Esquema fijo' },
    { value: 'HIGH_LEVEL_RANDOMIZATION', label: 'Randomización de nivel alto' },
  ];
  public timeUnits: Array<{ value: TimeUnit; label: string }> = [
    { value: 'MINUTES', label: 'Minutos' },
    { value: 'HOURS', label: 'Horas' },
    { value: 'DAYS', label: 'Días' },
    { value: 'WEEKS', label: 'Semanas' },
    { value: 'MONTHS', label: 'Meses' },
  ];
  public triggerReasonScopeOptions: Array<{ value: TriggerReasonScope; label: string }> = [
    { value: 'CLINICAL', label: 'Tratamiento' },
    { value: 'SUPERVISION', label: 'Supervisión' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private automationsService: EvaluationAutomationsService,
    private schemesService: EvaluationSchemesService,
    private assessmentAdministrationService: AssessmentAdministrationService,
    private questionnaireService: QuestionnaireManagementService,
    private bundlesService: QuestionnaireBundlesService,
    private randomizationsService: RandomizationsService,
    private errorService: ErrorHandlerService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadLookups();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.automationId = Number(id);
      this.loadAutomation(this.automationId);
    }
  }

  get isFixedScheme(): boolean {
    return this.form?.get('automationType')?.value === EvaluationAutomationType.FIXED_SCHEME;
  }

  get isIndividualEvaluation(): boolean {
    return this.form?.get('automationType')?.value === EvaluationAutomationType.INDIVIDUAL_EVALUATION;
  }

  get conditions(): FormArray {
    return this.form.get('conditions') as FormArray;
  }

  get lastLoginConditions(): FormArray {
    return this.form.get('lastLoginConditions') as FormArray;
  }

  get selectedDepartmentIds(): number[] {
    return this.form?.get('departmentIds')?.value || [];
  }

  public addCondition(condition?: any): void {
    this.conditions.push(
      this.fb.group({
        field: [condition?.field || null, Validators.required],
        operator: [condition?.operator || EvaluationAutomationConditionOperator.EQ, Validators.required],
        value: [condition?.value || null],
      })
    );
  }

  public removeCondition(index: number): void {
    this.conditions.removeAt(index);
  }

  public addLastLoginCondition(condition?: any): void {
    this.lastLoginConditions.push(
      this.fb.group({
        field: ['inactiveDays'],
        operator: [condition?.operator || EvaluationAutomationConditionOperator.GTE, Validators.required],
        value: [condition?.value || null, Validators.required],
      })
    );
  }

  public removeLastLoginCondition(index: number): void {
    this.lastLoginConditions.removeAt(index);
  }

  public onDepartmentsChange(): void {
    this.loadDepartmentScopedResources();
    this.loadTriggerReasons();
  }

  public onTriggerPointChange(triggerPoint: EvaluationAutomationTriggerPoint): void {
    if (triggerPoint !== EvaluationAutomationTriggerPoint.SESSION_NUMBER) {
      this.form.patchValue({ triggerSessionNumber: null });
    }
    if (triggerPoint !== EvaluationAutomationTriggerPoint.LAST_LOGIN) {
      this.form.patchValue({ lastLoginInactiveDays: null, lastLoginConditionLogic: 'AND' });
      this.lastLoginConditions.clear();
    } else if (!this.lastLoginConditions.length) {
      this.addLastLoginCondition();
    }
    if (!this.usesReasonFilter(triggerPoint)) {
      this.form.patchValue({ triggerReasonIds: [], triggerReasonScope: null });
      this.triggerReasonOptions = [];
      this.triggerReasonGroups = [];
      return;
    }
    this.form.patchValue({ triggerReasonIds: [], triggerReasonScope: null });
    this.loadTriggerReasons();
  }

  public onTriggerReasonScopeChange(): void {
    this.form.patchValue({ triggerReasonIds: [] });
    this.loadTriggerReasons();
  }

  public selectAllDepartments(): void {
    this.form.patchValue({
      departmentIds: this.departments.map((department) => department.id),
    });
    this.loadDepartmentScopedResources();
    this.loadTriggerReasons();
  }

  public removeAllDepartments(): void {
    this.form.patchValue({ departmentIds: [] });
    this.loadDepartmentScopedResources();
    this.loadTriggerReasons();
  }

  public onAutomationTypeChange(type: EvaluationAutomationType): void {
    this.form.patchValue({
      schemeId: null,
      schemeRandomizationRuleId: null,
      assessmentTypeId: null,
      questionnaireIds: null,
      questionnaireBundleIds: null,
      randomizationRuleIds: null,
      expirationMinutes: null,
      expirationUnit: 'MINUTES',
      reminderMinutesText: '',
      reminderUnit: 'MINUTES',
    });
  }

  public onFixedSelectionTypeChange(type: FixedAutomationSelectionType): void {
    this.form.patchValue({
      schemeId: type === 'SCHEME' ? this.form.get('schemeId')?.value : null,
      schemeRandomizationRuleId:
        type === 'HIGH_LEVEL_RANDOMIZATION' ? this.form.get('schemeRandomizationRuleId')?.value : null,
    });
  }

  public onContentTypeChange(type: EvaluationAutomationContentType): void {
    this.contentType = type;
    this.form.patchValue({
      questionnaireIds: null,
      questionnaireBundleIds: null,
      randomizationRuleIds: null,
    });
  }

  public save(): void {
    this.clearConditionalRequiredErrors();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.hasValidTypeConfiguration()) {
      return;
    }

    const payload = this.buildPayload();
    this.saving = true;
    const request = this.automationId
      ? this.automationsService.updateAutomation({ ...payload, id: this.automationId })
      : this.automationsService.createAutomation(payload);

    request.pipe(finalize(() => (this.saving = false))).subscribe(
      () => {
        this.message.success(this.automationId ? 'Automatización actualizada' : 'Automatización creada');
        this.router.navigate(['/psira/evaluation-automations']);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to save automation' })
    );
  }

  public summary(): string {
    const role = this.roles.find((item) => item.id === this.form?.get('roleId')?.value)?.name || 'el rol seleccionado';
    const trigger = this.triggerPointLabel[this.form?.get('triggerPoint')?.value] || 'el trigger seleccionado';
    const delay = this.form?.get('delayAmount')?.value || 0;
    const unit = this.delayUnitLabel[this.form?.get('delayUnit')?.value] || '';
    if (this.isFixedScheme) {
      const scheme = this.schemes.find((item) => item.id === this.form?.get('schemeId')?.value)?.name || 'el esquema seleccionado';
      return `Cuando un usuario con rol ${role} cumpla ${trigger}, se asignará el esquema fijo ${scheme} ${delay} ${unit.toLowerCase()} después.`;
    }
    const name = this.form?.get('evaluationName')?.value || 'la evaluación configurada';
    return `Cuando un usuario con rol ${role} cumpla ${trigger}, se programará ${name} ${delay} ${unit.toLowerCase()} después.`;
  }

  public isSessionNumberTrigger(): boolean {
    return this.form?.get('triggerPoint')?.value === EvaluationAutomationTriggerPoint.SESSION_NUMBER;
  }

  public isLastLoginTrigger(): boolean {
    return this.form?.get('triggerPoint')?.value === EvaluationAutomationTriggerPoint.LAST_LOGIN;
  }

  public usesReasonFilter(triggerPoint = this.form?.get('triggerPoint')?.value): boolean {
    return [
      EvaluationAutomationTriggerPoint.SESSION_NO_SHOW_CANCELLATION,
      EvaluationAutomationTriggerPoint.TREATMENT_FINALIZATION,
      EvaluationAutomationTriggerPoint.NEW_TREATMENT,
    ].includes(triggerPoint);
  }

  private buildForm(): void {
    this.form = this.fb.group({
      title: [null, Validators.required],
      description: [null],
      active: [true, Validators.required],
      priority: [100, [Validators.required, Validators.min(1)]],
      departmentIds: [[], Validators.required],
      roleId: [null, Validators.required],
      conditions: this.fb.array([]),
      triggerPoint: [EvaluationAutomationTriggerPoint.USER_CREATED, Validators.required],
      automationType: [EvaluationAutomationType.FIXED_SCHEME, Validators.required],
      triggerSessionNumber: [null],
      triggerReasonScope: [null],
      triggerReasonIds: [[]],
      lastLoginInactiveDays: [null],
      lastLoginConditionLogic: ['AND'],
      lastLoginConditions: this.fb.array([]),
      delayAmount: [0, [Validators.required, Validators.min(0)]],
      delayUnit: [EvaluationAutomationDelayUnit.DAYS, Validators.required],
      fixedSelectionType: ['SCHEME'],
      schemeId: [null],
      schemeRandomizationRuleId: [null],
      assessmentTypeId: [null],
      questionnaireIds: [null],
      questionnaireBundleIds: [null],
      randomizationRuleIds: [null],
      evaluationName: [null],
      expirationMinutes: [null],
      expirationUnit: ['MINUTES'],
      reminderMinutesText: [''],
      reminderUnit: ['MINUTES'],
    });
  }

  private loadLookups(): void {
    this.loading = true;
    forkJoin({
      departments: this.loadLookupDepartments(),
      roles: this.loadLookupRoles(),
      assessmentTypes: this.assessmentAdministrationService
        .assessmentActive()
        .pipe(map((result: any) => result.data.activeAssessmentTypes)),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ departments, roles, assessmentTypes }) => {
          this.departments = this.filterAllowedDepartments(departments);
          this.roles = this.filterAssignableRoles(roles);
          this.assessmentTypes = assessmentTypes;
          this.loadDepartmentScopedResources();
          this.loadTriggerReasons();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load automation options' })
      );
  }

  private loadLookupDepartments(after?: string, accumulated: Department[] = []): Observable<Department[]> {
    return this.automationsService
      .getLookupDepartments({
        paging: { first: 50, after },
        sorting: [{ field: 'name', direction: 'ASC' }],
      })
      .pipe(
        switchMap((page: any) => {
          const departments = [
            ...accumulated,
            ...page.edges.map((edge: any) => edge.node as Department),
          ];

          return page.pageInfo?.hasNextPage
            ? this.loadLookupDepartments(page.pageInfo.endCursor, departments)
            : of(departments);
        })
      );
  }

  private loadLookupRoles(after?: string, accumulated: Role[] = []): Observable<Role[]> {
    return this.automationsService
      .getLookupRoles({
        paging: { first: 50, after },
        sorting: [{ field: 'name', direction: 'ASC' }],
      })
      .pipe(
        switchMap((page: any) => {
          const roles = [
            ...accumulated,
            ...page.edges.map((edge: any) => edge.node as Role),
          ];

          return page.pageInfo?.hasNextPage
            ? this.loadLookupRoles(page.pageInfo.endCursor, roles)
            : of(roles);
        })
      );
  }

  private filterAllowedDepartments(departments: Department[]): Department[] {
    const user = this.currentUser();
    if (this.canAssignAnyPopulation(user)) {
      return departments;
    }

    const allowedIds = (user?.departments || []).map((department: any) => Number(department.id));
    return departments.filter((department: Department) => allowedIds.includes(Number(department.id)));
  }

  private filterAssignableRoles(roles: Role[]): Role[] {
    const user = this.currentUser();
    if (this.canAssignAnyPopulation(user)) {
      return roles;
    }

    const userHierarchies = (user?.roles || [])
      .map((role: any) => Number(role.hierarchy))
      .filter((hierarchy: number) => Number.isFinite(hierarchy));
    const strongestHierarchy = userHierarchies.length ? Math.min(...userHierarchies) : Number.MAX_SAFE_INTEGER;

    return roles.filter((role: Role) => Number(role.hierarchy) >= strongestHierarchy);
  }

  private canAssignAnyPopulation(user: any): boolean {
    return !!(
      user?.isSuperUser ||
      user?.roles?.some((role: any) => role.isSuperAdmin || role.code === 'SUPER_ADMIN') ||
      user?.permissions?.some((permission: any) => ['MANAGE_USERS', 'ASSIGN_ANY_ASSESSMENT_USER'].includes(permission.name)) ||
      user?.roles?.some((role: any) =>
        role.permissions?.some((permission: any) => ['MANAGE_USERS', 'ASSIGN_ANY_ASSESSMENT_USER'].includes(permission.name))
      )
    );
  }

  private currentUser(): any {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  private loadDepartmentScopedResources(): void {
    const departmentIds = this.selectedDepartmentIds;
    this.schemesService
      .getSchemes({
        paging: { first: 50 },
        departmentIds,
        filter: {
          and: [{ schemeType: { eq: EvaluationSchemeType.INDEPENDENT_EVALUATION } }, { active: { is: true } }],
        },
      })
      .subscribe(({ edges }) => (this.schemes = edges.map((edge: any) => edge.node)));

    this.questionnaireService
      .getQuestionnaires({
        paging: { first: 50 },
        departmentIds,
        filter: { status: { eq: 'PUBLISHED' } },
      })
      .subscribe((result: any) => (this.questionnaires = result.edges.map((edge: any) => edge.node)));

    this.bundlesService
      .getQuestionnairesBundles({ paging: { first: 50 }, departmentIds })
      .subscribe((result: any) => (this.bundles = result.data.getQuestionnaireBundles.edges.map((edge: any) => edge.node)));

    this.randomizationsService
      .getRandomizations({
        paging: { first: 50 },
        departmentIds,
        filter: {
          and: [{ type: { eq: RandomizationRuleType.LOW_LEVEL } }, { active: { is: true } }],
        },
      })
      .subscribe(({ edges }) => (this.randomizations = edges.map((edge: any) => edge.node)));

    this.randomizationsService
      .getRandomizations({
        paging: { first: 50 },
        departmentIds,
        filter: {
          and: [{ type: { eq: RandomizationRuleType.HIGH_LEVEL } }, { active: { is: true } }],
        },
      })
      .subscribe(({ edges }) => (this.highLevelRandomizations = edges.map((edge: any) => edge.node)));
  }

  private loadAutomation(id: number): void {
    this.loading = true;
    this.automationsService
      .getAutomation(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (automation) => this.patchAutomation(automation),
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load automation' })
      );
  }

  private patchAutomation(automation: EvaluationAutomation): void {
    this.conditions.clear();
    this.lastLoginConditions.clear();
    this.contentType = automation.questionnaireBundleIds?.length
      ? EvaluationAutomationContentType.QUESTIONNAIRE_BUNDLE
      : automation.randomizationRuleIds?.length
      ? EvaluationAutomationContentType.RANDOMIZATION
      : EvaluationAutomationContentType.QUESTIONNAIRE;
    this.form.patchValue({
      title: automation.title,
      description: automation.description,
      active: automation.active,
      priority: automation.priority,
      departmentIds: (automation.departments || []).map((department) => department.id),
      roleId: automation.role?.id,
      triggerPoint: automation.triggerPoint,
      automationType: automation.automationType,
      triggerSessionNumber: automation.triggerSessionNumber,
      triggerReasonScope: this.scopeForReasonContexts(automation.triggerReasonContexts || [], automation.triggerPoint),
      triggerReasonIds: automation.triggerReasonIds || [],
      lastLoginInactiveDays: automation.lastLoginInactiveDays,
      lastLoginConditionLogic: automation.lastLoginConditionLogic || 'AND',
      delayAmount: automation.delayAmount,
      delayUnit: automation.delayUnit,
      fixedSelectionType: automation.schemeRandomizationRuleId ? 'HIGH_LEVEL_RANDOMIZATION' : 'SCHEME',
      schemeId: automation.schemeId,
      schemeRandomizationRuleId: automation.schemeRandomizationRuleId,
      assessmentTypeId: automation.assessmentTypeId,
      questionnaireIds: automation.questionnaireIds?.[0] || null,
      questionnaireBundleIds: automation.questionnaireBundleIds?.[0] || null,
      randomizationRuleIds: automation.randomizationRuleIds?.[0] || null,
      evaluationName: automation.evaluationName,
      expirationMinutes: this.minutesToUnitAmount(automation.expirationMinutes, automation.expirationUnit as TimeUnit),
      expirationUnit: automation.expirationUnit || 'MINUTES',
      reminderMinutesText: this.minutesListToUnitText(automation.reminderMinutes || [], automation.reminderUnit as TimeUnit),
      reminderUnit: automation.reminderUnit || 'MINUTES',
    });
    (automation.conditions || []).forEach((condition) => this.addCondition(condition));
    (automation.lastLoginConditions || []).forEach((condition) => this.addLastLoginCondition(condition));
    if (automation.triggerPoint === EvaluationAutomationTriggerPoint.LAST_LOGIN && !this.lastLoginConditions.length && automation.lastLoginInactiveDays) {
      this.addLastLoginCondition({
        operator: EvaluationAutomationConditionOperator.GTE,
        value: automation.lastLoginInactiveDays,
      });
    }
    this.loadDepartmentScopedResources();
    this.loadTriggerReasons();
  }

  private buildPayload(): Partial<EvaluationAutomation> {
    const value = this.form.value;
    const payload: any = {
      title: value.title,
      description: value.description,
      active: value.active,
      priority: Number(value.priority),
      departmentIds: value.departmentIds,
      roleId: value.roleId,
      conditions: this.normalizedConditions(value.conditions),
      triggerPoint: value.triggerPoint,
      automationType: value.automationType,
      triggerSessionNumber: value.triggerPoint === EvaluationAutomationTriggerPoint.SESSION_NUMBER
        ? Number(value.triggerSessionNumber)
        : null,
      triggerReasonIds: this.usesReasonFilter(value.triggerPoint)
        ? this.normalizeNumberArray(value.triggerReasonIds)
        : [],
      triggerReasonContexts: this.usesReasonFilter(value.triggerPoint)
        ? this.contextsForTriggerScope(value.triggerPoint, value.triggerReasonScope)
        : [],
      lastLoginInactiveDays: value.triggerPoint === EvaluationAutomationTriggerPoint.LAST_LOGIN && value.lastLoginInactiveDays
        ? Number(value.lastLoginInactiveDays)
        : null,
      lastLoginConditionLogic: value.triggerPoint === EvaluationAutomationTriggerPoint.LAST_LOGIN
        ? value.lastLoginConditionLogic || 'AND'
        : 'AND',
      lastLoginConditions: value.triggerPoint === EvaluationAutomationTriggerPoint.LAST_LOGIN
        ? this.normalizedLastLoginConditions(value.lastLoginConditions)
        : [],
      delayAmount: Number(value.delayAmount),
      delayUnit: value.delayUnit,
    };

    if (value.automationType === EvaluationAutomationType.FIXED_SCHEME) {
      payload.schemeId = value.fixedSelectionType === 'SCHEME' ? value.schemeId : null;
      payload.schemeRandomizationRuleId = value.fixedSelectionType === 'HIGH_LEVEL_RANDOMIZATION'
        ? value.schemeRandomizationRuleId
        : null;
      payload.assessmentTypeId = null;
      payload.questionnaireIds = [];
      payload.questionnaireBundleIds = [];
      payload.randomizationRuleIds = [];
      payload.evaluationName = null;
      payload.expirationMinutes = null;
      payload.expirationUnit = 'MINUTES';
      payload.reminderMinutes = [];
      payload.reminderUnit = 'MINUTES';
      return payload;
    }

    payload.schemeId = null;
    payload.schemeRandomizationRuleId = null;
    payload.assessmentTypeId = value.assessmentTypeId;
    payload.evaluationName = value.evaluationName;
    payload.questionnaireIds =
      this.contentType === EvaluationAutomationContentType.QUESTIONNAIRE && value.questionnaireIds
        ? [value.questionnaireIds]
        : [];
    payload.questionnaireBundleIds =
      this.contentType === EvaluationAutomationContentType.QUESTIONNAIRE_BUNDLE && value.questionnaireBundleIds
        ? [value.questionnaireBundleIds]
        : [];
    payload.randomizationRuleIds =
      this.contentType === EvaluationAutomationContentType.RANDOMIZATION && value.randomizationRuleIds
        ? [value.randomizationRuleIds]
        : [];
    payload.expirationMinutes = value.expirationMinutes
      ? this.unitAmountToMinutes(Number(value.expirationMinutes), value.expirationUnit)
      : null;
    payload.expirationUnit = value.expirationUnit || 'MINUTES';
    payload.reminderMinutes = this.parseReminderMinutes(value.reminderMinutesText, value.reminderUnit);
    payload.reminderUnit = value.reminderUnit || 'MINUTES';
    return payload;
  }

  private hasValidTypeConfiguration(): boolean {
    const value = this.form.value;
    if (value.triggerPoint === EvaluationAutomationTriggerPoint.SESSION_NUMBER && !value.triggerSessionNumber) {
      this.markRequired('triggerSessionNumber');
      this.message.error('Debe indicarse el número de sesión que activa la automatización');
      return false;
    }
    if (
      value.triggerPoint === EvaluationAutomationTriggerPoint.LAST_LOGIN &&
      value.lastLoginInactiveDays &&
      Number(value.lastLoginInactiveDays) < 1
    ) {
      this.message.error('Los días desde el login anterior deben ser mayores a cero');
      return false;
    }

    if (value.automationType === EvaluationAutomationType.FIXED_SCHEME) {
      if (value.fixedSelectionType === 'SCHEME' && !value.schemeId) {
        this.markRequired('schemeId');
        this.message.error('Debe seleccionarse un esquema fijo');
        return false;
      }
      if (value.fixedSelectionType === 'HIGH_LEVEL_RANDOMIZATION' && !value.schemeRandomizationRuleId) {
        this.markRequired('schemeRandomizationRuleId');
        this.message.error('Debe seleccionarse una randomización de nivel alto');
        return false;
      }
      return true;
    }

    if (!value.assessmentTypeId) {
      this.markRequired('assessmentTypeId');
      this.message.error('Debe seleccionarse un tipo de evaluación');
      return false;
    }
    if (this.contentType === EvaluationAutomationContentType.QUESTIONNAIRE && !value.questionnaireIds) {
      this.markRequired('questionnaireIds');
      this.message.error('Debe seleccionarse un cuestionario');
      return false;
    }
    if (this.contentType === EvaluationAutomationContentType.QUESTIONNAIRE_BUNDLE && !value.questionnaireBundleIds) {
      this.markRequired('questionnaireBundleIds');
      this.message.error('Debe seleccionarse un paquete de cuestionarios');
      return false;
    }
    if (this.contentType === EvaluationAutomationContentType.RANDOMIZATION && !value.randomizationRuleIds) {
      this.markRequired('randomizationRuleIds');
      this.message.error('Debe seleccionarse una randomización');
      return false;
    }
    return true;
  }

  public conditionRequiresValue(index: number): boolean {
    const operator = this.conditions.at(index)?.get('operator')?.value;
    return ![
      EvaluationAutomationConditionOperator.IS_EMPTY,
      EvaluationAutomationConditionOperator.IS_NOT_EMPTY,
      EvaluationAutomationConditionOperator.BOOLEAN,
    ].includes(operator);
  }

  public lastLoginConditionRequiresValue(index: number): boolean {
    const operator = this.lastLoginConditions.at(index)?.get('operator')?.value;
    return ![
      EvaluationAutomationConditionOperator.IS_EMPTY,
      EvaluationAutomationConditionOperator.IS_NOT_EMPTY,
      EvaluationAutomationConditionOperator.BOOLEAN,
    ].includes(operator);
  }

  private normalizedConditions(conditions: any[]): any[] {
    return (conditions || [])
      .map((condition) => ({
        field: (condition.field || '').trim(),
        operator: condition.operator,
        value: this.conditionOperatorNeedsValue(condition.operator) ? condition.value : null,
      }))
      .filter((condition) => condition.field && condition.operator);
  }

  private normalizedLastLoginConditions(conditions: any[]): any[] {
    return (conditions || [])
      .map((condition) => ({
        field: 'inactiveDays',
        operator: condition.operator,
        value: `${condition.value || ''}`.trim(),
      }))
      .filter((condition) => condition.operator && condition.value);
  }

  private conditionOperatorNeedsValue(operator: EvaluationAutomationConditionOperator): boolean {
    return ![
      EvaluationAutomationConditionOperator.IS_EMPTY,
      EvaluationAutomationConditionOperator.IS_NOT_EMPTY,
      EvaluationAutomationConditionOperator.BOOLEAN,
    ].includes(operator);
  }

  private markRequired(controlName: string): void {
    const control = this.form.get(controlName);
    control?.setErrors({ ...(control.errors || {}), required: true });
    control?.markAsTouched();
    control?.markAsDirty();
  }

  private clearConditionalRequiredErrors(): void {
    [
      'triggerSessionNumber',
      'schemeId',
      'schemeRandomizationRuleId',
      'assessmentTypeId',
      'questionnaireIds',
      'questionnaireBundleIds',
      'randomizationRuleIds',
    ].forEach((controlName) => {
      const control = this.form.get(controlName);
      if (!control?.errors?.required) return;
      const errors = { ...control.errors };
      delete errors.required;
      control.setErrors(Object.keys(errors).length ? errors : null);
    });
  }

  private loadTriggerReasons(): void {
    const contexts = this.contextsForTriggerScope(
      this.form?.get('triggerPoint')?.value,
      this.form?.get('triggerReasonScope')?.value
    );
    if (!contexts.length) {
      this.triggerReasonOptions = [];
      this.triggerReasonGroups = [];
      return;
    }

    const departmentIds = this.selectedDepartmentIds.length ? this.selectedDepartmentIds : [undefined];
    forkJoin(
      contexts.flatMap((context) =>
        departmentIds.map((departmentId: number | undefined) =>
          this.loadReasonTree(context, undefined, departmentId).pipe(
            map((reasons) => ({ context, reasons }))
          )
        )
      )
    ).subscribe(
      (groups: Array<{ context: CaseEventReasonContext; reasons: CaseEventReason[] }>) => {
        const byId = new Map<number, CaseEventReason>();
        const byContext = new Map<CaseEventReasonContext, Map<number, CaseEventReason>>();
        groups.forEach((group) => {
          if (!byContext.has(group.context)) {
            byContext.set(group.context, new Map<number, CaseEventReason>());
          }
          group.reasons.forEach((reason: CaseEventReason) => {
            byId.set(reason.id, reason);
            byContext.get(group.context)?.set(reason.id, reason);
          });
        });
        this.triggerReasonOptions = Array.from(byId.values());
        this.triggerReasonGroups = Array.from(byContext.entries())
          .map(([context, reasons]) => ({
            label: this.contextLabel(context),
            reasons: Array.from(reasons.values()),
          }))
          .filter((group) => group.reasons.length);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load event reasons' })
    );
  }

  private loadReasonTree(
    context: CaseEventReasonContext,
    parentId?: number,
    departmentId?: number
  ): Observable<CaseEventReason[]> {
    return this.automationsService.getCaseEventReasons(context, parentId, departmentId).pipe(
      switchMap((reasons: CaseEventReason[]) => {
        if (!reasons.length) {
          return of([]);
        }
        return forkJoin(
          reasons.map((reason: CaseEventReason) =>
            this.loadReasonTree(context, reason.id, departmentId).pipe(
              map((children: CaseEventReason[]) => {
                const parentLabel = reason.label;
                return [
                  { ...reason, label: parentLabel },
                  ...children.map((child: CaseEventReason) => ({
                    ...child,
                    label: `${parentLabel} > ${child.label}`,
                  })),
                ];
              })
            )
          )
        ).pipe(map((groups: CaseEventReason[][]) => groups.flat()));
      })
    );
  }

  private contextsForTrigger(triggerPoint: EvaluationAutomationTriggerPoint): CaseEventReasonContext[] {
    switch (triggerPoint) {
      case EvaluationAutomationTriggerPoint.SESSION_NO_SHOW_CANCELLATION:
        return [
          CaseEventReasonContext.SESSION_CANCELLATION,
          CaseEventReasonContext.SUPERVISION_SESSION_CANCELLATION,
        ];
      case EvaluationAutomationTriggerPoint.TREATMENT_FINALIZATION:
        return [
          CaseEventReasonContext.TREATMENT_FINALIZATION,
          CaseEventReasonContext.SUPERVISION_FINALIZATION,
        ];
      case EvaluationAutomationTriggerPoint.NEW_TREATMENT:
        return [
          CaseEventReasonContext.NEW_TREATMENT,
          CaseEventReasonContext.NEW_SUPERVISION,
        ];
      default:
        return [];
    }
  }

  private contextsForTriggerScope(
    triggerPoint: EvaluationAutomationTriggerPoint,
    scope?: TriggerReasonScope
  ): CaseEventReasonContext[] {
    const contexts = this.contextsForTrigger(triggerPoint);
    if (!scope) return contexts;
    return contexts.filter((context) => this.scopeForContext(context) === scope);
  }

  private scopeForReasonContexts(
    contexts: CaseEventReasonContext[],
    triggerPoint: EvaluationAutomationTriggerPoint
  ): TriggerReasonScope | null {
    const expectedContexts = this.contextsForTrigger(triggerPoint);
    const scopedContexts = (contexts || []).filter((context) => expectedContexts.includes(context));
    if (!scopedContexts.length) return null;
    const scopes = Array.from(new Set(scopedContexts.map((context) => this.scopeForContext(context))));
    return scopes.length === 1 ? scopes[0] : null;
  }

  private scopeForContext(context: CaseEventReasonContext): TriggerReasonScope {
    return [
      CaseEventReasonContext.SUPERVISION_SESSION_CANCELLATION,
      CaseEventReasonContext.SUPERVISION_FINALIZATION,
      CaseEventReasonContext.NEW_SUPERVISION,
    ].includes(context)
      ? 'SUPERVISION'
      : 'CLINICAL';
  }

  private contextLabel(context: CaseEventReasonContext): string {
    switch (context) {
      case CaseEventReasonContext.SESSION_CANCELLATION:
        return 'Tratamiento';
      case CaseEventReasonContext.SUPERVISION_SESSION_CANCELLATION:
        return 'Supervisión';
      case CaseEventReasonContext.TREATMENT_FINALIZATION:
        return 'Tratamiento';
      case CaseEventReasonContext.SUPERVISION_FINALIZATION:
        return 'Supervisión';
      case CaseEventReasonContext.NEW_TREATMENT:
        return 'Tratamiento';
      case CaseEventReasonContext.NEW_SUPERVISION:
        return 'Supervisión';
      default:
        return 'Motivo';
    }
  }

  private parseReminderMinutes(value: string, unit: TimeUnit = 'MINUTES'): number[] {
    return (value || '')
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((part) => Number.isFinite(part) && part >= 0)
      .map((part) => this.unitAmountToMinutes(part, unit));
  }

  private unitAmountToMinutes(value: number, unit: TimeUnit = 'MINUTES'): number {
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

  private minutesToUnitAmount(value?: number, unit: TimeUnit = 'MINUTES'): number {
    if (value === undefined || value === null) return null;
    const divisor = this.unitAmountToMinutes(1, unit);
    return divisor ? value / divisor : value;
  }

  private minutesListToUnitText(values: number[], unit: TimeUnit = 'MINUTES'): string {
    return (values || [])
      .map((value) => this.minutesToUnitAmount(value, unit))
      .join(', ');
  }

  private normalizeNumberArray(value: any): number[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }
}
