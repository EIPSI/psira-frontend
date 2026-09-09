import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionnaireVersion } from '../@types/questionnaire';
import { switchMap } from 'rxjs/operators';
import { QuestionnaireManagementService } from '../@services/questionnaire-management.service';
import { QuestionnaireBundlesService } from '../@services/questionnaire-bundles.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { DepartmentsService } from '@app/pages/patients-management/@services/departments.service';
import { Convert } from '@app/@shared/classes/convert';
import { Filter } from '@app/@shared/@types/filter';
import { Paging } from '@app/@shared/@types/paging';
import { Sorting } from '@app/@shared/@types/sorting';
import { ErrorHandlerService } from '@app/@shared/services/error-handler.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AngularEditorConfig } from '@kolkov/angular-editor';

type BundleNodeType = 'QUESTIONNAIRE' | 'SCREEN' | 'FIXED_GROUP' | 'RANDOM_GROUP';
type RandomizationMode = 'RANDOM_ORDER' | 'REPLACEMENT';

interface BundleNode {
  id: string;
  type: BundleNodeType;
  label?: string | null;
  displayTitle?: string | null;
  headerHtml?: string | null;
  footerHtml?: string | null;
  showTitle?: boolean | null;
  questionnaireId?: string | null;
  randomizationMode?: RandomizationMode | null;
  selectionCount?: number | null;
  weight?: number | null;
  children?: BundleNode[];
}

@Component({
  selector: 'app-create-questionnaire-bundle',
  templateUrl: './create-questionnaire-bundle.component.html',
  styleUrls: ['./create-questionnaire-bundle.component.scss'],
})
export class CreateQuestionnaireBundleComponent implements OnInit {
  public structure: BundleNode[] = [];
  public questionnaires: QuestionnaireVersion[] = [];
  public departmentsRequestOptions: { paging: Paging; filter: Filter; sorting: Sorting[] } = {
    paging: { first: 50 },
    filter: {},
    sorting: [],
  };
  isUpdateMode = false;
  previewVisible = false;
  previewScreenItems: Array<{ title: string; headerHtml?: string; footerHtml?: string; questionnaires: any[] }> = [];
  selectedDepartments: number[] = [];
  selectedId: string;
  bundle: any;
  editorConfig: AngularEditorConfig = {
    minHeight: '140px',
    editable: true,
    sanitize: false,
  };
  bundleForm = this.fb.group({
    name: ['', Validators.required],
    headerHtml: [''],
    noticeHtml: [''],
    active: [true],
    departmentIds: [],
  });
  listOfDepartments: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private questionnaireService: QuestionnaireManagementService,
    private bundlesService: QuestionnaireBundlesService,
    private router: Router,
    private nzMessage: NzMessageService,
    private translate: TranslateService,
    private departmentsService: DepartmentsService,
    private errorService: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.structure = [this.createGroupNode('FIXED_GROUP', this.translate.instant('questionnaireBundles.defaultSequenceLabel'))];
    this.getDepartments();
    this.getQuestionnaires();
    this.route.params.subscribe((data) => {
      if (data._id) {
        this.isUpdateMode = true;
        this.route.paramMap
          .pipe(
            switchMap((params) => {
              this.selectedId = params.get('_id');
              this.bundleForm.addControl('_id', this.fb.control(this.selectedId));
              return this.bundlesService.getOneQuestionnaireBundle(this.selectedId);
            })
            // tslint:disable
          )
          .subscribe((data: any) => {
            this.bundle = data.data.getQuestionnaireBundle;
            this.bundleForm.controls['name'].setValue(this.bundle?.name);
            this.bundleForm.controls['headerHtml'].setValue(this.bundle?.headerHtml || '');
            this.bundleForm.controls['noticeHtml'].setValue(this.bundle?.noticeHtml || '');
            this.bundleForm.controls['active'].setValue(this.bundle?.active !== false);
            this.selectedDepartments = this.bundle?.departmentIds || [];
            this.structure = this.normalizeRootStructure(this.parseStructure(this.bundle?.structureJson));
          });
      }
    });
  }

  onFormSubmit() {
    this.bundleForm.controls['departmentIds'].setValue(this.selectedDepartments);
    this.bundlesService.createQuestionnaireBundle(this.buildPayload()).subscribe(
      () => {
        this.bundleForm.reset();
        const message$ = this.translate.get('bundles.created').subscribe((message) => {
          this.nzMessage.success(message, { nzDuration: 3000 });
        });
        message$.unsubscribe();
        this.router.navigate(['/psira/questionnaire-management/questionnaire-bundles-list']);
      },
      (err) => {
        this.nzMessage.error(this.formatGraphQLError(err), { nzDuration: 5000 });
      }
    );
  }

  onFormUpdateSubmit() {
    this.bundleForm.controls['departmentIds'].setValue(this.selectedDepartments);
    this.bundlesService.updateQuestionnaireBundle({ _id: this.selectedId, ...this.buildPayload() }).subscribe(
      () => {
        this.bundleForm.reset();
        const message$ = this.translate.get('bundles.updated').subscribe((message) => {
          this.nzMessage.success(message, { nzDuration: 3000 });
        });
        message$.unsubscribe();
        this.router.navigate(['/psira/questionnaire-management/questionnaire-bundles-list']);
      },
      (err) => {
        this.nzMessage.error(this.formatGraphQLError(err), { nzDuration: 5000 });
      }
    );
  }

  getDepartments(): void {
    this.loadDepartmentsPage();
  }

  private loadDepartmentsPage(after?: string, accumulatedDepartments: any[] = []): void {
    this.departmentsService
      .departments({
        ...this.departmentsRequestOptions,
        paging: { first: 50, after },
      })
      .pipe()
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
        (err) => this.errorService.handleError(err, { prefix: this.translate.instant('questionnaireBundles.unableLoadDepartments') })
      );
  }

  selectDepartments(event: any) {
    this.selectedDepartments = event;
  }

  departmentIsSelected(departmentId: number): boolean {
    return this.selectedDepartments.some((selectedDepartmentId) => Number(selectedDepartmentId) === Number(departmentId));
  }

  toggleDepartment(departmentId: number, checked: boolean): void {
    if (checked) {
      if (!this.departmentIsSelected(departmentId)) {
        this.selectedDepartments = [...this.selectedDepartments, departmentId];
        this.getQuestionnaires();
      }
      return;
    }

    this.selectedDepartments = this.selectedDepartments.filter(
      (selectedDepartmentId) => Number(selectedDepartmentId) !== Number(departmentId)
    );
    this.getQuestionnaires();
  }

  selectAllDepartments(): void {
    this.selectedDepartments = this.listOfDepartments.map((department: any) => department.id);
    this.getQuestionnaires();
  }

  removeAllDepartments(): void {
    this.selectedDepartments = [];
    this.getQuestionnaires();
  }

  getQuestionnaires(): void {
    this.questionnaireService.getQuestionnaires({
      paging: { first: 50 },
      departmentIds: this.selectedDepartments,
    }).subscribe(
      (data) => {
        this.questionnaires = data.edges
          .map((edge: any) => edge.node)
          .filter((questionnaire: any) =>
            questionnaire.status !== 'ARCHIVED' &&
            questionnaire.status !== 'DRAFT' &&
            questionnaire.zombie !== true &&
            this.matchesDepartments(questionnaire.departmentIds)
          );
        this.clearIncompatibleQuestionnaireNodes();
      },
      (err) => this.errorService.handleError(err, { prefix: this.translate.instant('questionnaireBundles.unableLoadQuestionnaires') })
    );
  }

  private matchesDepartments(itemDepartmentIds: number[] = []): boolean {
    if (!this.selectedDepartments?.length || !itemDepartmentIds?.length) return true;
    return this.selectedDepartments.every((departmentId) =>
      itemDepartmentIds.map(Number).includes(Number(departmentId))
    );
  }

  private clearIncompatibleQuestionnaireNodes(nodes: BundleNode[] = this.rootChildren): void {
    const availableIds = this.questionnaires.map((questionnaire) => questionnaire._id);
    nodes.forEach((node) => {
      if (node.type === 'QUESTIONNAIRE' && node.questionnaireId && !availableIds.includes(node.questionnaireId)) {
        node.questionnaireId = null;
      }
      this.clearIncompatibleQuestionnaireNodes(node.children || []);
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

  get rootNode(): BundleNode {
    this.structure = this.normalizeRootStructure(this.structure);
    return this.structure[0];
  }

  get rootChildren(): BundleNode[] {
    const root = this.rootNode;
    this.ensureChildren(root);
    return root.children as BundleNode[];
  }

  addQuestionnaire(nodes: BundleNode[] = this.rootChildren): void {
    nodes.push({
      id: this.createNodeId(),
      type: 'QUESTIONNAIRE',
      questionnaireId: this.questionnaires[0]?._id,
      displayTitle: null,
      showTitle: true,
      weight: 1,
    });
  }

  addFixedGroup(nodes: BundleNode[] = this.rootChildren): void {
    nodes.push(this.createGroupNode('FIXED_GROUP', this.translate.instant('questionnaireBundles.fixedGroup')));
  }

  addScreen(nodes: BundleNode[] = this.rootChildren): void {
    nodes.push(this.createGroupNode('SCREEN', this.translate.instant('questionnaireBundles.screen')));
  }

  addRandomGroup(nodes: BundleNode[] = this.rootChildren): void {
    nodes.push(this.createGroupNode('RANDOM_GROUP', this.translate.instant('questionnaireBundles.randomizedGroup')));
  }

  addChildQuestionnaire(node: BundleNode): void {
    this.ensureChildren(node);
    this.addQuestionnaire(node.children);
  }

  addChildFixedGroup(node: BundleNode): void {
    this.ensureChildren(node);
    this.addFixedGroup(node.children);
  }

  addChildScreen(node: BundleNode): void {
    this.ensureChildren(node);
    this.addScreen(node.children);
  }

  addChildRandomGroup(node: BundleNode): void {
    this.ensureChildren(node);
    this.addRandomGroup(node.children);
  }

  removeNode(nodes: BundleNode[], index: number): void {
    nodes.splice(index, 1);
  }

  moveNode(nodes: BundleNode[], index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= nodes.length) return;
    const [node] = nodes.splice(index, 1);
    nodes.splice(target, 0, node);
  }

  dropNode(event: CdkDragDrop<BundleNode[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
  }

  setRootType(type: Exclude<BundleNodeType, 'QUESTIONNAIRE'>): void {
    this.rootNode.type = type;
    if (type === 'RANDOM_GROUP') {
      this.rootNode.randomizationMode = this.rootNode.randomizationMode || 'RANDOM_ORDER';
      this.rootNode.selectionCount = this.rootNode.selectionCount || 1;
    } else {
      this.rootNode.randomizationMode = null;
      this.rootNode.selectionCount = null;
    }
  }

  dropListId(node: BundleNode): string {
    return `bundle-drop-${node.id}`;
  }

  dropListIds(): string[] {
    const ids: string[] = [];
    this.collectDropListIds(this.structure, ids);
    return ids;
  }

  questionnaireName(questionnaireId: string | null | undefined): string {
    return this.questionnaires.find((questionnaire) => questionnaire._id === questionnaireId)?.name || this.translate.instant('core.questionnaire');
  }

  countQuestionnaires(nodes: BundleNode[] = this.structure): number {
    return nodes.reduce(
      (count, node) => count + (node.type === 'QUESTIONNAIRE' ? 1 : this.countQuestionnaires(node.children || [])),
      0
    );
  }

  countGroups(nodes: BundleNode[] = this.structure): number {
    return nodes.reduce(
      (count, node) =>
        count +
        (node.type === 'FIXED_GROUP' || node.type === 'RANDOM_GROUP' ? 1 : 0) +
        this.countGroups(node.children || []),
      0
    );
  }

  countScreens(nodes: BundleNode[] = this.structure): number {
    return nodes.reduce(
      (count, node) => count + (node.type === 'SCREEN' ? 1 : 0) + this.countScreens(node.children || []),
      0
    );
  }

  previewScreens(): Array<{ title: string; headerHtml?: string; footerHtml?: string; questionnaires: any[] }> {
    const screens: Array<{ title: string; headerHtml?: string; footerHtml?: string; questionnaires: any[] }> = [];
    const collectQuestionnaires = (nodes: BundleNode[] = [], target: any[]) => {
      nodes.forEach((node) => {
        if (node.type === 'QUESTIONNAIRE') {
          const title = node.displayTitle || (node.showTitle === false ? '' : this.questionnaireName(node.questionnaireId));
          const questionnaire = this.questionnaireById(node.questionnaireId);
          target.push({
            title,
            questionGroups: (questionnaire as any)?.questionGroups || [],
          });
          return;
        }
        collectQuestionnaires(node.children || [], target);
      });
    };
    const visit = (nodes: BundleNode[] = []) => {
      nodes.forEach((node) => {
        if (node.type === 'SCREEN') {
          const questionnaires: any[] = [];
          collectQuestionnaires(node.children || [], questionnaires);
          screens.push({
            title: node.displayTitle || '',
            headerHtml: node.headerHtml,
            footerHtml: node.footerHtml,
            questionnaires,
          });
          return;
        }
        visit(node.children || []);
      });
    };
    visit(this.structure);
    if (!screens.length) {
      const questionnaires: any[] = [];
      collectQuestionnaires(this.rootChildren, questionnaires);
      screens.push({ title: '', questionnaires });
    }
    return screens;
  }

  questionnaireById(questionnaireId: string | null | undefined): QuestionnaireVersion | undefined {
    return this.questionnaires.find((questionnaire) => questionnaire._id === questionnaireId);
  }

  openPreview(): void {
    this.previewScreenItems = this.previewScreens();
    this.previewVisible = true;
  }

  bundleHasDepartment(currentDepartmentId: number): boolean {
    if (this.isUpdateMode && this.bundle !== undefined) {
      const department = this.bundle?.departmentIds?.filter(
        (departmentId: any) => departmentId === currentDepartmentId
      );
      return department.length > 0;
    }
    return false;
  }

  private buildPayload(): any {
    this.structure = this.normalizeRootStructure(this.structure);
    const structure = this.sanitizeNodes(this.structure);
    return {
      name: this.bundleForm.value.name,
      headerHtml: this.bundleForm.value.headerHtml || '',
      noticeHtml: this.bundleForm.value.noticeHtml || '',
      active: this.bundleForm.value.active !== false,
      departmentIds: this.selectedDepartments || [],
      structure,
      structureJson: JSON.stringify(structure),
    };
  }

  private parseStructure(value: string): BundleNode[] {
    try {
      return JSON.parse(value || '[]');
    } catch {
      return [];
    }
  }

  private normalizeRootStructure(nodes: BundleNode[]): BundleNode[] {
    const currentNodes = nodes || [];

    if (!currentNodes.length) {
      return [this.createGroupNode('FIXED_GROUP', this.translate.instant('questionnaireBundles.defaultSequenceLabel'))];
    }

    if (currentNodes.length === 1 && currentNodes[0].type !== 'QUESTIONNAIRE') {
      currentNodes[0].children = currentNodes[0].children || [];
      return currentNodes;
    }

    return [
      {
        ...this.createGroupNode('FIXED_GROUP', this.translate.instant('questionnaireBundles.defaultSequenceLabel')),
        children: currentNodes,
      },
    ];
  }

  private sanitizeNodes(nodes: BundleNode[]): BundleNode[] {
    return (nodes || []).map((node) => {
      const sanitized: BundleNode = {
        id: node.id || this.createNodeId(),
        type: node.type,
      };
      const weight = Number(node.weight);
      if (Number.isFinite(weight) && weight > 0) sanitized.weight = weight;

      if (node.type === 'QUESTIONNAIRE') {
        sanitized.questionnaireId = node.questionnaireId;
        sanitized.displayTitle = node.displayTitle || null;
        sanitized.showTitle = node.showTitle !== false;
        return sanitized;
      }

      sanitized.label = node.label || null;
      sanitized.displayTitle = node.displayTitle || null;
      sanitized.headerHtml = node.headerHtml || null;
      sanitized.footerHtml = node.footerHtml || null;
      sanitized.children = this.sanitizeNodes(node.children || []);

      if (node.type === 'RANDOM_GROUP') {
        sanitized.randomizationMode = node.randomizationMode || 'RANDOM_ORDER';
        sanitized.selectionCount = Number(node.selectionCount) || 1;
      }

      return sanitized;
    });
  }

  private ensureChildren(node: BundleNode): void {
    if (!node.children) node.children = [];
  }

  private createGroupNode(type: Exclude<BundleNodeType, 'QUESTIONNAIRE'>, label: string): BundleNode {
    return {
      id: this.createNodeId(),
      type,
      label,
      displayTitle: null,
      headerHtml: null,
      footerHtml: null,
      randomizationMode: type === 'RANDOM_GROUP' ? 'RANDOM_ORDER' : null,
      selectionCount: type === 'RANDOM_GROUP' ? 1 : null,
      weight: 1,
      children: [],
    };
  }

  private collectDropListIds(nodes: BundleNode[], ids: string[]): void {
    (nodes || []).forEach((node: BundleNode) => {
      if (node.type === 'QUESTIONNAIRE') return;
      ids.push(this.dropListId(node));
      this.collectDropListIds(node.children || [], ids);
    });
  }

  private createNodeId(): string {
    return `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private formatGraphQLError(error: any): string {
    const graphQLErrors = error?.graphQLErrors || error?.networkError?.result?.errors || [];
    if (graphQLErrors.length) {
      return graphQLErrors.map((graphQLError: any) => graphQLError.message).join(' ');
    }

    return error?.message || this.translate.instant('questionnaireBundles.unableSave');
  }
}
