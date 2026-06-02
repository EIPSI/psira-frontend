import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AssessmentAdministrationService } from '@app/pages/administration/@services/assessment-administration.service';
import { EmailTemplatesService } from '@app/pages/administration/@services/email-templates.service';
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
  EvaluationAutomation,
  EvaluationAutomationConditionOperator,
  EvaluationAutomationContentType,
  EvaluationAutomationDelayUnit,
  EvaluationAutomationTriggerPoint,
  EvaluationAutomationTriggerPointLabel,
  EvaluationAutomationType,
  EvaluationAutomationTypeLabel,
} from '../@types/evaluation-automation';

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
  public emailTemplates: any[] = [];
  public contentType = EvaluationAutomationContentType.QUESTIONNAIRE;

  public triggerPoints = Object.values(EvaluationAutomationTriggerPoint);
  public triggerPointLabel = EvaluationAutomationTriggerPointLabel;
  public automationTypes = Object.values(EvaluationAutomationType);
  public automationTypeLabel = EvaluationAutomationTypeLabel;
  public EAT = EvaluationAutomationType;
  public EACT = EvaluationAutomationContentType;

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
    private emailTemplatesService: EmailTemplatesService,
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

  public onDepartmentsChange(): void {
    this.loadDepartmentScopedResources();
  }

  public selectAllDepartments(): void {
    this.form.patchValue({
      departmentIds: this.departments.map((department) => department.id),
    });
    this.loadDepartmentScopedResources();
  }

  public removeAllDepartments(): void {
    this.form.patchValue({ departmentIds: [] });
    this.loadDepartmentScopedResources();
  }

  public onAutomationTypeChange(type: EvaluationAutomationType): void {
    this.form.patchValue({
      delayUnit: type === EvaluationAutomationType.FIXED_SCHEME ? EvaluationAutomationDelayUnit.DAYS : EvaluationAutomationDelayUnit.MINUTES,
      schemeId: null,
      assessmentTypeId: null,
      questionnaireIds: null,
      questionnaireBundleIds: null,
      randomizationRuleIds: null,
      expirationMinutes: null,
      reminderMinutesText: '',
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
    if (this.isFixedScheme) {
      const scheme = this.schemes.find((item) => item.id === this.form?.get('schemeId')?.value)?.name || 'el esquema seleccionado';
      return `Cuando un usuario con rol ${role} cumpla ${trigger}, se asignará el esquema fijo ${scheme} ${delay} día(s) después.`;
    }
    const name = this.form?.get('evaluationName')?.value || 'la evaluación configurada';
    return `Cuando un usuario con rol ${role} cumpla ${trigger}, se programará ${name} ${delay} minuto(s) después.`;
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
      delayAmount: [0, [Validators.required, Validators.min(0)]],
      delayUnit: [EvaluationAutomationDelayUnit.DAYS, Validators.required],
      schemeId: [null],
      assessmentTypeId: [null],
      questionnaireIds: [null],
      questionnaireBundleIds: [null],
      randomizationRuleIds: [null],
      evaluationName: [null],
      expirationMinutes: [null],
      reminderMinutesText: [''],
      emailNotificationsEnabled: [true],
      mailTemplateId: [null],
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
      emailTemplates: this.emailTemplatesService
        .getAllEmailTemplates({ paging: { first: 50 } })
        .pipe(map((result: any) => result.data.getAllEmailTemplates.edges.map((edge: any) => edge.node))),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ departments, roles, assessmentTypes, emailTemplates }) => {
          this.departments = this.filterAllowedDepartments(departments);
          this.roles = this.filterAssignableRoles(roles);
          this.assessmentTypes = assessmentTypes;
          this.emailTemplates = emailTemplates;
          this.loadDepartmentScopedResources();
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
      delayAmount: automation.delayAmount,
      delayUnit: automation.delayUnit,
      schemeId: automation.schemeId,
      assessmentTypeId: automation.assessmentTypeId,
      questionnaireIds: automation.questionnaireIds?.[0] || null,
      questionnaireBundleIds: automation.questionnaireBundleIds?.[0] || null,
      randomizationRuleIds: automation.randomizationRuleIds?.[0] || null,
      evaluationName: automation.evaluationName,
      expirationMinutes: automation.expirationMinutes,
      reminderMinutesText: (automation.reminderMinutes || []).join(', '),
      emailNotificationsEnabled: automation.emailNotificationsEnabled !== false,
      mailTemplateId: automation.mailTemplateId,
    });
    this.loadDepartmentScopedResources();
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
      conditions: [],
      triggerPoint: value.triggerPoint,
      automationType: value.automationType,
      delayAmount: Number(value.delayAmount),
      delayUnit: value.delayUnit,
    };

    if (value.automationType === EvaluationAutomationType.FIXED_SCHEME) {
      payload.schemeId = value.schemeId;
      payload.assessmentTypeId = null;
      payload.questionnaireIds = [];
      payload.questionnaireBundleIds = [];
      payload.randomizationRuleIds = [];
      payload.evaluationName = null;
      payload.expirationMinutes = null;
      payload.reminderMinutes = [];
      payload.emailNotificationsEnabled = false;
      payload.mailTemplateId = null;
      return payload;
    }

    payload.schemeId = null;
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
    payload.expirationMinutes = value.expirationMinutes;
    payload.reminderMinutes = this.parseReminderMinutes(value.reminderMinutesText);
    payload.emailNotificationsEnabled = value.emailNotificationsEnabled;
    payload.mailTemplateId = value.emailNotificationsEnabled ? value.mailTemplateId : null;
    return payload;
  }

  private hasValidTypeConfiguration(): boolean {
    const value = this.form.value;
    if (value.automationType === EvaluationAutomationType.FIXED_SCHEME) {
      if (!value.schemeId) {
        this.message.error('Debe seleccionarse un esquema fijo');
        return false;
      }
      return true;
    }

    if (!value.assessmentTypeId) {
      this.message.error('Debe seleccionarse un tipo de evaluación');
      return false;
    }
    if (this.contentType === EvaluationAutomationContentType.QUESTIONNAIRE && !value.questionnaireIds) {
      this.message.error('Debe seleccionarse un cuestionario');
      return false;
    }
    if (this.contentType === EvaluationAutomationContentType.QUESTIONNAIRE_BUNDLE && !value.questionnaireBundleIds) {
      this.message.error('Debe seleccionarse un paquete de cuestionarios');
      return false;
    }
    if (this.contentType === EvaluationAutomationContentType.RANDOMIZATION && !value.randomizationRuleIds) {
      this.message.error('Debe seleccionarse una randomización');
      return false;
    }
    if (value.emailNotificationsEnabled && !value.mailTemplateId) {
      this.message.error('El template de email es obligatorio cuando el email está activo');
      return false;
    }
    return true;
  }

  private parseReminderMinutes(value: string): number[] {
    return (value || '')
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((part) => Number.isFinite(part) && part >= 0);
  }
}
