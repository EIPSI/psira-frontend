import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Convert } from '@app/@shared/classes/convert';
import { ErrorHandlerService } from '@app/@shared/services/error-handler.service';
import { DepartmentsService } from '@app/pages/patients-management/@services/departments.service';
import { EvaluationScheme, EvaluationSchemeType } from '@app/pages/evaluation-schemes/@types/evaluation-scheme';
import { EvaluationSchemesService } from '@app/pages/evaluation-schemes/@services/evaluation-schemes.service';
import { QuestionnaireBundlesService } from '@app/pages/questionnaire-management/@services/questionnaire-bundles.service';
import { QuestionnaireManagementService } from '@app/pages/questionnaire-management/@services/questionnaire-management.service';
import {
  QuestionnaireStatus,
  QuestionnaireVersion,
} from '@app/pages/questionnaire-management/@types/questionnaire';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import {
  RandomizationRule,
  RandomizationRuleItemType,
  RandomizationRuleType,
  RandomizationRuleTypeLabel,
} from '../@types/randomization';
import { RandomizationsService } from '../@services/randomizations.service';

interface RandomizationDraftItem {
  id: string;
  itemType: RandomizationRuleItemType;
  questionnaireId?: string;
  questionnaireBundleId?: string;
  evaluationSchemeId?: number;
  weight: number;
}

@Component({
  selector: 'app-randomization-editor',
  templateUrl: './randomization-editor.component.html',
  styleUrls: ['./randomization-editor.component.scss'],
})
export class RandomizationEditorComponent implements OnInit {
  public readonly RT = RandomizationRuleType;
  public readonly RIT = RandomizationRuleItemType;
  public readonly typeLabel = RandomizationRuleTypeLabel;
  public loading = false;
  public saving = false;
  public currentRandomizationId?: number;
  public selectedDepartments: number[] = [];
  public listOfDepartments: any[] = [];
  public questionnaires: QuestionnaireVersion[] = [];
  public questionnaireBundles: any[] = [];
  public fixedSchemes: EvaluationScheme[] = [];
  public items: RandomizationDraftItem[] = [];

  public form = this.fb.group({
    name: ['', Validators.required],
    active: [true],
    type: [RandomizationRuleType.LOW_LEVEL, Validators.required],
    departmentIds: [[]],
  });

  get isUpdateMode(): boolean {
    return !!this.currentRandomizationId;
  }

  get selectedType(): RandomizationRuleType {
    return this.form.get('type')?.value;
  }

  get itemCountLabel(): string {
    return `${this.items.length} elementos`;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private randomizationsService: RandomizationsService,
    private departmentsService: DepartmentsService,
    private questionnaireService: QuestionnaireManagementService,
    private bundlesService: QuestionnaireBundlesService,
    private schemesService: EvaluationSchemesService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
    this.loadOptions();
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) return of(null);
          this.currentRandomizationId = Number(id);
          this.loading = true;
          return this.randomizationsService.getRandomization(this.currentRandomizationId);
        })
      )
      .subscribe(
        (randomization: RandomizationRule | null) => {
          if (randomization) this.applyRandomization(randomization);
          this.loading = false;
        },
        (error) => {
          this.loading = false;
          this.errorService.handleError(error, { prefix: 'Unable to load randomization' });
        }
      );
  }

  public onTypeChange(type: RandomizationRuleType): void {
    this.items = [];
    this.loadOptions();
    if (type === RandomizationRuleType.LOW_LEVEL) {
      this.addQuestionnaire();
      this.addQuestionnaireBundle();
      return;
    }
    this.addEvaluationScheme();
    this.addEvaluationScheme();
  }

  public addQuestionnaire(): void {
    this.items.push({
      id: this.createDraftId(),
      itemType: RandomizationRuleItemType.QUESTIONNAIRE,
      questionnaireId: this.questionnaires[0]?._id,
      weight: 1,
    });
  }

  public addQuestionnaireBundle(): void {
    this.items.push({
      id: this.createDraftId(),
      itemType: RandomizationRuleItemType.QUESTIONNAIRE_BUNDLE,
      questionnaireBundleId: this.questionnaireBundles[0]?._id,
      weight: 1,
    });
  }

  public addEvaluationScheme(): void {
    this.items.push({
      id: this.createDraftId(),
      itemType: RandomizationRuleItemType.EVALUATION_SCHEME,
      evaluationSchemeId: this.fixedSchemes[0]?.id,
      weight: 1,
    });
  }

  public removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  public moveItem(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this.items.length) return;
    const [item] = this.items.splice(index, 1);
    this.items.splice(target, 0, item);
  }

  public selectAllDepartments(): void {
    this.selectedDepartments = this.listOfDepartments.map((department: any) => department.id);
    this.loadOptions();
  }

  public removeAllDepartments(): void {
    this.selectedDepartments = [];
    this.loadOptions();
  }

  public departmentIsSelected(departmentId: number): boolean {
    return this.selectedDepartments.some((selectedDepartmentId) => Number(selectedDepartmentId) === Number(departmentId));
  }

  public toggleDepartment(departmentId: number, checked: boolean): void {
    if (checked) {
      if (!this.departmentIsSelected(departmentId)) {
        this.selectedDepartments = [...this.selectedDepartments, departmentId];
        this.loadOptions();
      }
      return;
    }

    this.selectedDepartments = this.selectedDepartments.filter(
      (selectedDepartmentId) => Number(selectedDepartmentId) !== Number(departmentId)
    );
    this.loadOptions();
  }

  public save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const error = this.validateItems();
    if (error) {
      this.message.error(error, { nzDuration: 5000 });
      return;
    }

    this.saving = true;
    const payload = this.buildPayload();
    const request$ = this.isUpdateMode
      ? this.randomizationsService.updateRandomization({ id: this.currentRandomizationId, ...payload })
      : this.randomizationsService.createRandomization(payload);

    request$.pipe(finalize(() => (this.saving = false))).subscribe(
      () => {
        this.message.success(this.translate.instant(this.isUpdateMode ? 'randomizations.updated' : 'randomizations.created'));
        this.router.navigate(['/psira/randomizations']);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to save randomization' })
    );
  }

  private loadDepartments(): void {
    this.loadDepartmentsPage();
  }

  private loadDepartmentsPage(after?: string, accumulatedDepartments: any[] = []): void {
    this.departmentsService
      .departments({ paging: { first: 50, after }, filter: {}, sorting: [] })
      .subscribe(
        ({ data }: any) => {
          const departments = data.departments.edges.map((department: any) =>
            Convert.toDepartment(department.node)
          );
          const allDepartments = [...accumulatedDepartments, ...departments];
          this.listOfDepartments = this.filterAllowedDepartments(allDepartments);

          if (data.departments.pageInfo?.hasNextPage) {
            this.loadDepartmentsPage(data.departments.pageInfo.endCursor, allDepartments);
          }
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load departments' })
      );
  }

  private loadOptions(): void {
    this.questionnaireService.getQuestionnaires({
      paging: { first: 50 },
      departmentIds: this.selectedDepartments,
    }).subscribe(
      (data) => {
        this.questionnaires = data.edges
          .map((edge: any) => edge.node)
          .filter(
            (questionnaire: QuestionnaireVersion) =>
              questionnaire.status !== QuestionnaireStatus.ARCHIVED &&
              questionnaire.status !== QuestionnaireStatus.DRAFT &&
              questionnaire.zombie !== true &&
              this.matchesSelectedDepartments(questionnaire.departmentIds)
          );
        this.clearIncompatibleItems();
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load questionnaires' })
    );

    this.bundlesService.getQuestionnairesBundles({ departmentIds: this.selectedDepartments } as any).subscribe(
      (data: any) => {
        this.questionnaireBundles = (data.data?.getQuestionnaireBundles?.edges || [])
          .map((edge: any) => edge.node)
          .filter((bundle: any) => bundle.active !== false && this.matchesSelectedDepartments(bundle.departmentIds));
        this.clearIncompatibleItems();
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load questionnaire bundles' })
    );

    this.schemesService.getSchemes({
      paging: { first: 50 },
      departmentIds: this.selectedDepartments,
    }).subscribe(
      ({ edges }) => {
        this.fixedSchemes = edges
          .map((edge: any) => edge.node)
          .filter(
            (scheme: EvaluationScheme) =>
              scheme.active !== false &&
              scheme.schemeType === EvaluationSchemeType.INDEPENDENT_EVALUATION &&
              this.matchesSelectedDepartments((scheme.departments || []).map((department: any) => department.id))
          );
        this.clearIncompatibleItems();
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load fixed schemes' })
    );
  }

  private applyRandomization(randomization: RandomizationRule): void {
    this.form.patchValue({
      name: randomization.name,
      active: randomization.active !== false,
      type: randomization.type,
      departmentIds: (randomization.departments || []).map((department) => department.id),
    });
    this.selectedDepartments = (randomization.departments || []).map((department) => department.id);
    this.loadOptions();
    this.items = (randomization.items || [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: this.createDraftId(),
        itemType: item.itemType,
        questionnaireId: item.questionnaireId,
        questionnaireBundleId: item.questionnaireBundleId,
        evaluationSchemeId: item.evaluationSchemeId,
        weight: item.weight || 1,
      }));
  }

  private validateItems(): string | null {
    if (this.items.length < 2) return this.translate.instant('randomizations.minItemsRequired');

    const seen = new Set<string>();
    for (const item of this.items) {
      if (!Number.isFinite(Number(item.weight)) || Number(item.weight) <= 0) {
        return this.translate.instant('randomizations.weightMustBePositive');
      }

      const key = this.itemKey(item);
      if (!key) return this.translate.instant('randomizations.validSelectionRequired');
      if (seen.has(key)) return this.translate.instant('randomizations.duplicatesNotAllowed');
      seen.add(key);
    }

    return null;
  }

  private matchesSelectedDepartments(itemDepartmentIds: number[] = []): boolean {
    if (!this.selectedDepartments?.length || !itemDepartmentIds?.length) return true;
    const itemIds = itemDepartmentIds.map(Number);
    return this.selectedDepartments.every((departmentId) => itemIds.includes(Number(departmentId)));
  }

  private clearIncompatibleItems(): void {
    const questionnaireIds = this.questionnaires.map((questionnaire) => questionnaire._id);
    const bundleIds = this.questionnaireBundles.map((bundle) => bundle._id);
    const schemeIds = this.fixedSchemes.map((scheme) => scheme.id);

    this.items = this.items.map((item) => ({
      ...item,
      questionnaireId:
        item.questionnaireId && questionnaireIds.includes(item.questionnaireId) ? item.questionnaireId : null,
      questionnaireBundleId:
        item.questionnaireBundleId && bundleIds.includes(item.questionnaireBundleId) ? item.questionnaireBundleId : null,
      evaluationSchemeId:
        item.evaluationSchemeId && schemeIds.includes(item.evaluationSchemeId) ? item.evaluationSchemeId : null,
    }));
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

  private itemKey(item: RandomizationDraftItem): string | null {
    if (item.itemType === RandomizationRuleItemType.QUESTIONNAIRE) {
      return item.questionnaireId ? `${item.itemType}:${item.questionnaireId}` : null;
    }
    if (item.itemType === RandomizationRuleItemType.QUESTIONNAIRE_BUNDLE) {
      return item.questionnaireBundleId ? `${item.itemType}:${item.questionnaireBundleId}` : null;
    }
    return item.evaluationSchemeId ? `${item.itemType}:${item.evaluationSchemeId}` : null;
  }

  private buildPayload(): any {
    this.form.controls['departmentIds'].setValue(this.selectedDepartments);
    return {
      name: this.form.value.name,
      active: this.form.value.active !== false,
      type: this.form.value.type,
      departmentIds: this.selectedDepartments || [],
      items: this.items.map((item, index) => ({
        itemType: item.itemType,
        questionnaireId:
          item.itemType === RandomizationRuleItemType.QUESTIONNAIRE ? item.questionnaireId : null,
        questionnaireBundleId:
          item.itemType === RandomizationRuleItemType.QUESTIONNAIRE_BUNDLE ? item.questionnaireBundleId : null,
        evaluationSchemeId:
          item.itemType === RandomizationRuleItemType.EVALUATION_SCHEME ? item.evaluationSchemeId : null,
        weight: Number(item.weight),
        position: index,
      })),
    };
  }

  private createDraftId(): string {
    return `randomization-item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
