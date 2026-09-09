import { Component, OnInit } from '@angular/core';
import { forkJoin, from, Observable, of } from 'rxjs';
import { concatMap, finalize, map, switchMap, toArray } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {
  Action,
  ActionArgs,
  TableColumn,
} from '@shared/@modules/master-data/@types/list';
import { PageInfo } from '@shared/@types/paging';
import {
  CaseEventReason,
  CaseEventReasonContext,
  CaseEventReasonTree,
} from '@app/pages/calendar/@types/calendar';
import { CalendarService } from '@app/pages/calendar/@services/calendar.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { DepartmentsService } from '@app/pages/administration/@services/departments.service';
import { Department } from '@app/pages/administration/@types/department';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TranslateService } from '@ngx-translate/core';

interface FlatReason extends CaseEventReason {
  depth: number;
  path: string;
  activeLabel?: string;
}

interface ReasonTreeRow {
  id?: number;
  context: CaseEventReasonContext;
  place?: ReasonPlace;
  scope?: ReasonScope;
  departmentId?: number | null;
  departmentIds?: number[];
  levelLabels?: string[];
  contextName?: string;
  placeName?: string;
  scopeName?: string;
  departmentName?: string;
  rootCount: number;
  nodeCount: number;
}

type ReasonPlace = 'SESSION_CANCELLATION' | 'FINALIZATION' | 'NEW_CYCLE' | 'INFORMED_CONSENT_REACTIVATION';
type ReasonScope = 'CLINICAL' | 'SUPERVISION';

enum TreeActionKey {
  EDIT,
  DELETE,
}

enum ReasonActionKey {
  ADD_CHILD,
  EDIT,
  TOGGLE_ACTIVE,
  DELETE,
}

@Component({
  selector: 'app-session-cancellation-reasons',
  templateUrl: './session-cancellation-reasons.component.html',
  styleUrls: ['./session-cancellation-reasons.component.scss'],
})
export class SessionCancellationReasonsComponent implements OnInit {
  public CREC = CaseEventReasonContext;
  loading = false;
  saving = false;
  departments: Department[] = [];
  treeRows: ReasonTreeRow[] = [];
  filteredTreeRows: ReasonTreeRow[] = [];
  selectedTree?: ReasonTreeRow;
  reasons: CaseEventReason[] = [];
  flatReasons: FlatReason[] = [];
  filteredReasons: FlatReason[] = [];
  pageInfo: PageInfo = {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  };
  treeActions: Action<TreeActionKey>[] = [];
  reasonActions: Action<ReasonActionKey>[] = [];
  treeColumns: TableColumn<ReasonTreeRow>[] = [];
  reasonColumns: TableColumn<FlatReason>[] = [];
  searchString = '';

  treeModalVisible = false;
  treePlace?: ReasonPlace;
  treeScope?: ReasonScope;
  treeDepartmentIds: number[] = [];
  treeLevelLabels: string[] = [];
  editingTree?: ReasonTreeRow;

  reasonModalVisible = false;
  editingReason?: CaseEventReason;
  label = '';
  nextLevelLabel = '';
  parentId?: number | null;
  reasonEditLevel = 1;
  sortOrder = 0;
  active = true;
  isOther = false;

  placeOptions: Array<{ value: ReasonPlace; label: string }> = [];
  scopeOptions: Array<{ value: ReasonScope; label: string }> = [];

  constructor(
    private calendarService: CalendarService,
    private departmentsService: DepartmentsService,
    private errorService: ErrorHandlerService,
    private message: NzMessageService,
    private modalService: NzModalService,
    private translate: TranslateService
  ) {
    this.initializeTranslatedConfig();
    this.treeLevelLabels = [this.translate.instant('reasonTrees.reason')];
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  private initializeTranslatedConfig(): void {
    this.treeActions = [
      { key: TreeActionKey.EDIT, title: this.translate.instant('core.edit') },
      { key: TreeActionKey.DELETE, title: this.translate.instant('core.delete') },
    ];
    this.reasonActions = [
      { key: ReasonActionKey.ADD_CHILD, title: this.translate.instant('reasonTrees.addSubreason') },
      { key: ReasonActionKey.EDIT, title: this.translate.instant('core.edit') },
      { key: ReasonActionKey.TOGGLE_ACTIVE, title: this.translate.instant('core.toggleActive') },
      { key: ReasonActionKey.DELETE, title: this.translate.instant('core.delete') },
    ];
    this.treeColumns = [
      { name: 'placeName', title: 'reasonTrees.place', translationPath: 'reasonTrees.place', sort: true },
      { name: 'scopeName', title: 'reasonTrees.scope', translationPath: 'reasonTrees.scope', sort: true },
      { name: 'departmentName', title: 'reasonTrees.department', translationPath: 'reasonTrees.department', sort: true },
      { name: 'rootCount', title: 'reasonTrees.rootReasons', translationPath: 'reasonTrees.rootReasons', sort: true },
      { name: 'nodeCount', title: 'reasonTrees.totalReasons', translationPath: 'reasonTrees.totalReasons', sort: true },
    ];
    this.reasonColumns = [
      { name: 'path', title: 'reasonTrees.reason', translationPath: 'reasonTrees.reason', sort: true },
      { name: 'sortOrder', title: 'reasonTrees.order', translationPath: 'reasonTrees.order', sort: true },
      { name: 'activeLabel' as keyof FlatReason, title: 'core.status', translationPath: 'core.status', sort: true },
    ];
    this.placeOptions = [
      { value: 'SESSION_CANCELLATION', label: this.translate.instant('reasonTrees.placeNoShowCancellation') },
      { value: 'FINALIZATION', label: this.translate.instant('reasonTrees.placeFinalization') },
      { value: 'NEW_CYCLE', label: this.translate.instant('reasonTrees.placeNewCycle') },
      { value: 'INFORMED_CONSENT_REACTIVATION', label: this.translate.instant('reasonTrees.placeInformedConsentReactivation') },
    ];
    this.scopeOptions = [
      { value: 'CLINICAL', label: this.translate.instant('reasonTrees.scopeTreatment') },
      { value: 'SUPERVISION', label: this.translate.instant('reasonTrees.scopeSupervision') },
    ];
  }

  openCreateTreeModal(): void {
    this.editingTree = undefined;
    this.treePlace = undefined;
    this.treeScope = undefined;
    this.treeDepartmentIds = [];
    this.treeLevelLabels = [this.translate.instant('reasonTrees.reason')];
    this.treeModalVisible = true;
  }

  onTreePlaceChange(place?: ReasonPlace): void {
    this.treePlace = place;
    if (place === 'INFORMED_CONSENT_REACTIVATION') {
      this.treeScope = undefined;
    }
  }

  openEditTreeModal(tree: ReasonTreeRow): void {
    this.editingTree = tree;
    this.treePlace = tree.place || this.placeForContext(tree.context);
    this.treeScope = tree.scope || this.scopeForContext(tree.context);
    this.treeDepartmentIds = tree.departmentId ? [tree.departmentId] : [];
    this.treeLevelLabels = this.normalizeLevelLabels(tree.levelLabels);
    this.treeModalVisible = true;
  }

  closeCreateTreeModal(): void {
    this.treeModalVisible = false;
    this.editingTree = undefined;
    this.treePlace = undefined;
    this.treeScope = undefined;
    this.treeDepartmentIds = [];
    this.treeLevelLabels = [this.translate.instant('reasonTrees.reason')];
  }

  saveTreeSelection(): void {
    if (!this.treePlace) {
      this.message.warning(this.translate.instant('reasonTrees.placeRequired'));
      return;
    }
    if (!this.isGlobalReactivationPlace(this.treePlace) && !this.treeScope) {
      this.message.warning(this.translate.instant('reasonTrees.scopeRequired'));
      return;
    }

    const context = this.contextForPlaceAndScope(this.treePlace, this.treeScope);
    const departmentIds = this.treeDepartmentIds || [];
    const departmentScopes = departmentIds.length ? departmentIds : [null];
    const activeTree = this.editingTree || this.selectedTree;
    const duplicate = this.findDuplicateTree(context, departmentScopes, activeTree);
    if (duplicate) {
      this.message.info(this.translate.instant('reasonTrees.duplicateTree', {
        context: this.contextLabel(context),
        scope: this.scopeLabel(duplicate.departmentId),
      }));
      return;
    }

    if (activeTree) {
      this.updateTreeScope(activeTree, context, departmentScopes);
      return;
    }

    this.createTreeScopes(context, departmentScopes);
  }

  openTree(tree: ReasonTreeRow): void {
    const decoratedTree = this.decorateTree(tree);
    this.selectedTree = decoratedTree;
    this.editingTree = decoratedTree;
    this.treePlace = decoratedTree.place || this.placeForContext(decoratedTree.context);
    this.treeScope = decoratedTree.scope || this.scopeForContext(decoratedTree.context);
    this.treeDepartmentIds = tree.departmentId ? [tree.departmentId] : [];
    this.treeLevelLabels = this.normalizeLevelLabels(tree.levelLabels);
    this.loadReasons();
  }

  backToTrees(): void {
    this.selectedTree = undefined;
    this.editingTree = undefined;
    this.treePlace = undefined;
    this.treeScope = undefined;
    this.treeDepartmentIds = [];
    this.treeLevelLabels = [this.translate.instant('reasonTrees.reason')];
    this.reasons = [];
    this.flatReasons = [];
    this.loadTrees();
  }

  loadReasons(): void {
    if (!this.selectedTree) return;
    this.loading = true;
    this.calendarService
      .getCaseEventReasons(
        this.selectedTree.context,
        undefined,
        this.selectedTree.departmentId,
        true,
        true
      )
      .pipe(
        switchMap((reasons) => {
          if (!reasons.length) return of([]);
          return forkJoin(reasons.map((reason) => this.loadReasonBranch(reason)));
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe(
        (reasons) => {
          this.reasons = reasons;
          this.flatReasons = this.flattenReasons(reasons).map((reason) => this.decorateReason(reason));
          this.applySearch();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('reasonTrees.unableLoadReasons') })
      );
  }

  openCreateReasonModal(parent?: CaseEventReason): void {
    this.editingReason = undefined;
    this.label = '';
    this.nextLevelLabel = '';
    this.parentId = parent?.id;
    this.reasonEditLevel = parent ? this.findReasonDepth(parent.id) + 1 : 1;
    this.sortOrder = 0;
    this.active = true;
    this.isOther = false;
    this.reasonModalVisible = true;
  }

  openEditReasonModal(reason: CaseEventReason): void {
    this.editingReason = reason;
    this.label = reason.label;
    this.nextLevelLabel = reason.nextLevelLabel || '';
    this.parentId = reason.parentId;
    this.reasonEditLevel = this.findReasonDepth(reason.id);
    this.sortOrder = reason.sortOrder || 0;
    this.active = reason.active !== false;
    this.isOther = !!reason.isOther;
    this.reasonModalVisible = true;
  }

  closeReasonModal(): void {
    this.reasonModalVisible = false;
    this.editingReason = undefined;
    this.label = '';
    this.nextLevelLabel = '';
    this.parentId = undefined;
    this.reasonEditLevel = 1;
    this.sortOrder = 0;
    this.active = true;
    this.isOther = false;
  }

  saveReason(): void {
    if (!this.selectedTree) return;
    if (!this.label.trim()) {
      this.message.warning(this.translate.instant('reasonTrees.reasonRequired'));
      return;
    }

    this.saving = true;
    const payload = {
      context: this.selectedTree.context,
      label: this.label.trim(),
      nextLevelLabel: this.nextLevelLabel.trim() || undefined,
      parentId: this.parentId,
      departmentId: this.selectedTree.departmentId,
      active: this.active,
      isOther: this.isOther,
      sortOrder: Number(this.sortOrder || 0),
    };
    const request = this.editingReason
      ? this.calendarService.updateCaseEventReason({
          id: this.editingReason.id,
          ...payload,
        })
      : this.calendarService.createCaseEventReason(payload);

    request
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => {
          this.message.success(
            this.editingReason
              ? this.translate.instant('reasonTrees.reasonUpdated')
              : this.translate.instant('reasonTrees.reasonAdded')
          );
          this.closeReasonModal();
          this.loadReasons();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('reasonTrees.unableSaveReason') })
      );
  }

  deactivateReason(reason: CaseEventReason): void {
    this.modalService.confirm({
      nzTitle: this.translate.instant('reasonTrees.deleteReason'),
      nzContent: this.translate.instant('reasonTrees.deleteReasonConfirm', { reason: reason.label }),
      nzOkText: this.translate.instant('core.delete'),
      nzOkDanger: true,
      nzOnOk: () => {
        this.saving = true;
        return this.calendarService
          .deleteCaseEventReason(reason.id)
          .pipe(finalize(() => (this.saving = false)))
          .subscribe(
            () => this.loadReasons(),
            (error) => this.errorService.handleError(error, { prefix: this.translate.instant('reasonTrees.unableDeleteReason') })
          );
      },
    });
  }

  onSearch(searchString: string): void {
    this.searchString = searchString || '';
    this.applySearch();
  }

  onTreeAction({ action, context: tree }: ActionArgs<ReasonTreeRow, TreeActionKey>): void {
    switch (action.key) {
      case TreeActionKey.EDIT:
        this.openEditTreeModal(tree);
        return;
      case TreeActionKey.DELETE:
        this.deleteTree(tree);
        return;
    }
  }

  onReasonAction({ action, context: reason }: ActionArgs<FlatReason, ReasonActionKey>): void {
    switch (action.key) {
      case ReasonActionKey.ADD_CHILD:
        this.openCreateReasonModal(reason);
        return;
      case ReasonActionKey.EDIT:
        this.openEditReasonModal(reason);
        return;
      case ReasonActionKey.TOGGLE_ACTIVE:
        this.setReasonActive(reason, !reason.active);
        return;
      case ReasonActionKey.DELETE:
        this.deactivateReason(reason);
        return;
    }
  }

  reasonLevelLabel(level: number): string {
    const labels = this.normalizeLevelLabels(this.treeLevelLabels);
    if (level === 1) return labels[0] || this.translate.instant('reasonTrees.reason');
    return this.translate.instant('reasonTrees.subreason');
  }

  reasonNodeLevelLabel(parent: CaseEventReason | null | undefined, level: number): string {
    if (!parent) return this.reasonLevelLabel(1);
    return parent.nextLevelLabel || this.reasonLevelLabel(level);
  }

  reasonEditLabel(): string {
    if (!this.parentId) return this.reasonLevelLabel(1);
    const parent = this.flatReasons.find((reason) => Number(reason.id) === Number(this.parentId));
    return parent?.nextLevelLabel || this.reasonLevelLabel(this.reasonEditLevel);
  }

  findReasonDepth(reasonId?: number): number {
    if (!reasonId) return 1;
    const reason = this.flatReasons.find((item) => item.id === reasonId);
    return reason ? reason.depth + 1 : 1;
  }

  setReasonActive(reason: CaseEventReason, active: boolean): void {
    this.saving = true;
    const request = active
      ? this.calendarService.updateCaseEventReason({ id: reason.id, active: true })
      : this.calendarService.deactivateCaseEventReason(reason.id);

    request
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        () => this.loadReasons(),
        (error) => this.errorService.handleError(error, { prefix: 'Unable to update reason' })
      );
  }

  reasonIndent(reason: FlatReason): string {
    return `${reason.depth * 20}px`;
  }

  contextLabel(context?: CaseEventReasonContext): string {
    return [this.placeLabel(this.placeForContext(context)), this.scopeLabelForContext(context)]
      .filter((value) => !!value)
      .join(' - ') || 'Motivos';
  }

  placeLabel(place?: ReasonPlace): string {
    return this.placeOptions.find((option) => option.value === place)?.label || this.translate.instant('reasonTrees.place');
  }

  scopeLabelForContext(context?: CaseEventReasonContext): string {
    if (this.placeForContext(context) === 'INFORMED_CONSENT_REACTIVATION') return this.translate.instant('reasonTrees.allUsers');
    return this.scopeOptions.find((option) => option.value === this.scopeForContext(context))?.label || '';
  }

  scopeLabel(departmentId?: number): string {
    if (!departmentId) return this.translate.instant('core.default');
    return this.departments.find((department) => Number(department.id) === Number(departmentId))?.name || this.translate.instant('reasonTrees.departmentNumber', { id: departmentId });
  }

  selectedTreeTitle(): string {
    if (!this.selectedTree) return '';
    const place = this.selectedTree.place || this.placeForContext(this.selectedTree.context);
    const scope = this.selectedTree.scope || this.scopeForContext(this.selectedTree.context);
    const scopeName = place === 'INFORMED_CONSENT_REACTIVATION' ? this.translate.instant('reasonTrees.allUsers') : this.scopeName(scope);
    return `${this.placeLabel(place)} - ${scopeName} - ${this.scopeLabel(this.selectedTree.departmentId)}`;
  }

  scopeName(scope?: ReasonScope): string {
    return this.scopeOptions.find((option) => option.value === scope)?.label || this.translate.instant('reasonTrees.scope');
  }

  isGlobalReactivationPlace(place?: ReasonPlace): boolean {
    return place === 'INFORMED_CONSENT_REACTIVATION';
  }

  dropListId(parent?: CaseEventReason | ReasonTreeRow): string {
    return `reason-drop-${parent?.id || 'root'}`;
  }

  dropListIds(): string[] {
    const ids = [this.dropListId(this.selectedTree)];
    this.collectReasonDropListIds(this.reasons, ids);
    return ids;
  }

  dropReason(event: CdkDragDrop<CaseEventReason[]>, parent?: CaseEventReason): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    this.persistReasonOrder(event.container.data, parent?.id || null);
  }

  private loadDepartments(after?: string, accumulated: Department[] = []): void {
    this.loading = true;
    this.departmentsService.departments({ paging: { first: 50, after } }).subscribe(
      ({ data }: any) => {
        const nodes = data.departments.edges.map((edge: any) => edge.node);
        const all = [...accumulated, ...nodes];
        if (data.departments.pageInfo.hasNextPage) {
          this.loadDepartments(data.departments.pageInfo.endCursor, all);
        } else {
          this.departments = all;
          this.loadTrees();
        }
      },
      (error) => {
        this.loading = false;
        this.errorService.handleError(error, { prefix: this.translate.instant('departments.unableLoadDepartments') });
      }
    );
  }

  private loadTrees(): void {
    this.loading = true;
    this.calendarService.getCaseEventReasonTrees(false)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (trees) => {
          if (!trees.length) {
            this.treeRows = [];
            this.applySearch();
            return;
          }
          forkJoin(trees.map((tree) => this.loadTreeRow(tree))).subscribe(
            (rows) => {
              this.treeRows = rows
                .map((tree) => this.decorateTree(tree))
                .sort((a, b) =>
                  String(a.contextName).localeCompare(String(b.contextName)) ||
                  String(a.departmentName).localeCompare(String(b.departmentName))
                );
              this.applySearch();
            },
            (error) => this.errorService.handleError(error, { prefix: this.translate.instant('reasonTrees.unableLoadTrees') })
          );
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('reasonTrees.unableLoadTrees') })
      );
  }

  private loadTreeRow(tree: CaseEventReasonTree): Observable<ReasonTreeRow> {
    return this.calendarService
      .getCaseEventReasons(tree.context, undefined, tree.departmentId, true, true)
      .pipe(
        switchMap((roots) => {
          if (!roots.length) {
            return of({
              id: tree.id,
              context: tree.context,
              departmentId: tree.departmentId,
              levelLabels: tree.levelLabels,
              rootCount: 0,
              nodeCount: 0,
            });
          }
          return forkJoin(roots.map((root) => this.countBranch(tree.context, tree.departmentId, root.id))).pipe(
            map((childCounts) => ({
              id: tree.id,
              context: tree.context,
              departmentId: tree.departmentId,
              levelLabels: tree.levelLabels,
              rootCount: roots.length,
              nodeCount: roots.length + childCounts.reduce((sum, count) => sum + count, 0),
            }))
          );
        })
      );
  }

  private updateTreeScope(
    tree: ReasonTreeRow,
    context: CaseEventReasonContext,
    departmentScopes: Array<number | null>
  ): void {
    this.saving = true;
    this.loadFlatReasonsForTree(tree)
      .pipe(
        switchMap((reasons) =>
          this.saveTreeIntoScopes(context, departmentScopes, reasons)
        ),
        finalize(() => (this.saving = false))
      )
      .subscribe(
        () => {
          this.message.success(this.translate.instant('reasonTrees.treeUpdated'));
          this.closeCreateTreeModal();
          this.selectedTree = undefined;
          this.loadTrees();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('reasonTrees.unableUpdateTree') })
      );
  }

  private createTreeScopes(
    context: CaseEventReasonContext,
    departmentScopes: Array<number | null>
  ): void {
    const levelLabels = this.normalizeLevelLabels(this.treeLevelLabels);
    this.saving = true;
    from(departmentScopes)
      .pipe(
        concatMap((departmentId) =>
          this.calendarService.createCaseEventReasonTree({ context, departmentId, levelLabels })
        ),
        toArray(),
        finalize(() => (this.saving = false))
      )
      .subscribe(
        (trees) => {
          this.message.success(this.translate.instant('reasonTrees.treeCreated'));
          this.closeCreateTreeModal();
          const firstTree = trees[0];
          this.openTree(this.decorateTree({
            id: firstTree.id,
            context: firstTree.context,
            departmentId: firstTree.departmentId,
            levelLabels: firstTree.levelLabels,
            rootCount: 0,
            nodeCount: 0,
          }));
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('reasonTrees.unableCreateTree') })
      );
  }

  private deleteTree(tree: ReasonTreeRow): void {
    if (!tree.id) return;
    this.modalService.confirm({
      nzTitle: this.translate.instant('reasonTrees.deleteTree'),
      nzContent: this.translate.instant('reasonTrees.deleteTreeConfirm', {
        tree: `${this.contextLabel(tree.context)} - ${this.scopeLabel(tree.departmentId)}`,
      }),
      nzOkText: this.translate.instant('core.delete'),
      nzOkDanger: true,
      nzOnOk: () => {
        this.saving = true;
        return this.calendarService
          .deactivateCaseEventReasonTree(tree.id)
          .pipe(finalize(() => (this.saving = false)))
          .subscribe(
            () => this.loadTrees(),
            (error) => this.errorService.handleError(error, { prefix: this.translate.instant('reasonTrees.unableDeleteTree') })
          );
      },
    });
  }

  private loadFlatReasonsForTree(tree: ReasonTreeRow): Observable<FlatReason[]> {
    return this.calendarService
      .getCaseEventReasons(tree.context, undefined, tree.departmentId, true, true)
      .pipe(
        switchMap((roots) => {
          if (!roots.length) return of([]);
          return forkJoin(roots.map((root) => this.loadReasonBranchForTree(tree, root))).pipe(
            map((reasons) => this.flattenReasons(reasons))
          );
        })
      );
  }

  private saveTreeIntoScopes(
    context: CaseEventReasonContext,
    departmentScopes: Array<number | null>,
    reasons: FlatReason[]
  ): Observable<any[]> {
    const firstScope = departmentScopes[0];
    const remainingScopes = departmentScopes.slice(1);
    const levelLabels = this.normalizeLevelLabels(this.treeLevelLabels);
    const updateCurrentTree = this.editingTree?.id
      ? this.calendarService.updateCaseEventReasonTree({
          id: this.editingTree.id,
          context,
          departmentId: firstScope,
          levelLabels,
        })
      : of(null);

    return updateCurrentTree.pipe(
      switchMap(() => {
        if (!remainingScopes.length || !reasons.length) return of([]);
        return from(remainingScopes).pipe(
          concatMap((departmentId) =>
            this.calendarService.createCaseEventReasonTree({ context, departmentId, levelLabels }).pipe(
              switchMap(() => this.cloneTreeReasons(reasons, context, departmentId))
            )
          ),
          toArray()
        );
      })
    );
  }

  private cloneTreeReasons(
    reasons: FlatReason[],
    context: CaseEventReasonContext,
    departmentId?: number | null
  ): Observable<CaseEventReason[]> {
    const idMap = new Map<number, number>();
    return from(reasons).pipe(
      concatMap((reason) =>
          this.calendarService.createCaseEventReason({
          context,
          label: reason.label,
          nextLevelLabel: reason.nextLevelLabel,
          parentId: reason.parentId ? idMap.get(reason.parentId) : undefined,
          departmentId,
          active: reason.active,
          isOther: reason.isOther,
          sortOrder: reason.sortOrder,
        }).pipe(
          map((created) => {
            idMap.set(reason.id, created.id);
            return created;
          })
        )
      ),
      toArray()
    );
  }

  private findDuplicateTree(
    context: CaseEventReasonContext,
    departmentScopes: Array<number | null>,
    excludedTree?: ReasonTreeRow
  ): ReasonTreeRow | undefined {
    return this.treeRows.find((tree) =>
      Number(tree.id || 0) !== Number(excludedTree?.id || 0) &&
      tree.context === context &&
      departmentScopes.some((departmentId) =>
        Number(tree.departmentId || 0) === Number(departmentId || 0)
      )
    );
  }

  private countBranch(
    context: CaseEventReasonContext,
    departmentId: number | null,
    parentId: number
  ): Observable<number> {
    return this.calendarService.getCaseEventReasons(context, parentId, departmentId, true, true).pipe(
      switchMap((children) => {
        if (!children.length) return of(0);
        return forkJoin(children.map((child) => this.countBranch(context, departmentId, child.id))).pipe(
          map((childCounts) => children.length + childCounts.reduce((sum, count) => sum + count, 0))
        );
      })
    );
  }

  private loadReasonBranch(reason: CaseEventReason): Observable<CaseEventReason> {
    if (!this.selectedTree) return of(reason);
    return this.loadReasonBranchForTree(this.selectedTree, reason);
  }

  private loadReasonBranchForTree(
    tree: ReasonTreeRow,
    reason: CaseEventReason
  ): Observable<CaseEventReason> {
    return this.calendarService
      .getCaseEventReasons(
        tree.context,
        reason.id,
        tree.departmentId,
        true,
        true
      )
      .pipe(
        switchMap((children) => {
          if (!children.length) return of({ ...reason, children: [] });
          return forkJoin(children.map((child) => this.loadReasonBranch(child))).pipe(
            map((resolvedChildren) => ({ ...reason, children: resolvedChildren }))
          );
        })
      );
  }

  private flattenReasons(
    reasons: CaseEventReason[],
    depth = 0,
    parentPath = ''
  ): FlatReason[] {
    return reasons.reduce((flat: FlatReason[], reason) => {
      const path = parentPath ? `${parentPath} > ${reason.label}` : reason.label;
      flat.push({ ...reason, depth, path });
      flat.push(...this.flattenReasons(reason.children || [], depth + 1, path));
      return flat;
    }, []);
  }

  private decorateTree(tree: ReasonTreeRow): ReasonTreeRow {
    return {
      ...tree,
      levelLabels: this.normalizeLevelLabels(tree.levelLabels),
      place: this.placeForContext(tree.context),
      scope: this.scopeForContext(tree.context),
      departmentIds: tree.departmentId ? [tree.departmentId] : [],
      contextName: this.contextLabel(tree.context),
      placeName: this.placeLabel(this.placeForContext(tree.context)),
      scopeName: this.scopeLabelForContext(tree.context),
      departmentName: this.scopeLabel(tree.departmentId),
    };
  }

  private normalizeLevelLabels(labels?: string[]): string[] {
    const normalized = (labels || [])
      .map((label) => String(label || '').trim())
      .filter((label) => !!label);
    return [normalized[0] || this.translate.instant('reasonTrees.reason')];
  }

  private decorateReason(reason: FlatReason): FlatReason {
    return {
      ...reason,
      activeLabel: reason.active ? this.translate.instant('core.active') : this.translate.instant('core.inactive'),
    } as FlatReason;
  }

  private applySearch(): void {
    const search = this.searchString.trim().toLowerCase();
    if (!search) {
      this.filteredTreeRows = this.treeRows;
      this.filteredReasons = this.flatReasons;
      return;
    }

    this.filteredTreeRows = this.treeRows.filter((tree) =>
      [tree.placeName, tree.scopeName, tree.departmentName]
        .some((value) => String(value || '').toLowerCase().includes(search))
    );
    this.filteredReasons = this.flatReasons.filter((reason) =>
      [reason.path, reason.activeLabel, reason.sortOrder]
        .some((value) => String(value || '').toLowerCase().includes(search))
    );
  }

  private persistReasonOrder(reasons: CaseEventReason[], parentId: number | null): void {
    if (!this.selectedTree) return;
    from(reasons)
      .pipe(
        concatMap((reason, index) =>
          this.calendarService.updateCaseEventReason({
            id: reason.id,
            context: this.selectedTree.context,
            parentId,
            departmentId: this.selectedTree.departmentId,
            sortOrder: (index + 1) * 10,
          })
        ),
        toArray()
      )
      .subscribe(
        () => this.loadReasons(),
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('reasonTrees.unableReorderReasons') })
      );
  }

  private collectReasonDropListIds(reasons: CaseEventReason[], ids: string[]): void {
    for (const reason of reasons || []) {
      ids.push(this.dropListId(reason));
      this.collectReasonDropListIds(reason.children || [], ids);
    }
  }

  private contextForPlaceAndScope(place: ReasonPlace, scope?: ReasonScope): CaseEventReasonContext {
    if (place === 'SESSION_CANCELLATION') {
      return scope === 'SUPERVISION'
        ? CaseEventReasonContext.SUPERVISION_SESSION_CANCELLATION
        : CaseEventReasonContext.SESSION_CANCELLATION;
    }
    if (place === 'FINALIZATION') {
      return scope === 'SUPERVISION'
        ? CaseEventReasonContext.SUPERVISION_FINALIZATION
        : CaseEventReasonContext.TREATMENT_FINALIZATION;
    }
    if (place === 'INFORMED_CONSENT_REACTIVATION') {
      return CaseEventReasonContext.INFORMED_CONSENT_REACTIVATION;
    }
    return scope === 'SUPERVISION'
      ? CaseEventReasonContext.NEW_SUPERVISION
      : CaseEventReasonContext.NEW_TREATMENT;
  }

  private placeForContext(context?: CaseEventReasonContext): ReasonPlace | undefined {
    switch (String(context || '')) {
      case 'SESSION_CANCELLATION':
      case 'SUPERVISION_SESSION_CANCELLATION':
        return 'SESSION_CANCELLATION';
      case 'TREATMENT_FINALIZATION':
      case 'SUPERVISION_FINALIZATION':
        return 'FINALIZATION';
      case 'NEW_TREATMENT':
      case 'NEW_SUPERVISION':
        return 'NEW_CYCLE';
      case 'INFORMED_CONSENT_REACTIVATION':
      case 'SUPERVISION_INFORMED_CONSENT_REACTIVATION':
        return 'INFORMED_CONSENT_REACTIVATION';
      default:
        return undefined;
    }
  }

  private scopeForContext(context?: CaseEventReasonContext): ReasonScope | undefined {
    switch (String(context || '')) {
      case 'SUPERVISION_SESSION_CANCELLATION':
      case 'SUPERVISION_FINALIZATION':
      case 'NEW_SUPERVISION':
        return 'SUPERVISION';
      case 'SESSION_CANCELLATION':
      case 'TREATMENT_FINALIZATION':
      case 'NEW_TREATMENT':
        return 'CLINICAL';
      case 'INFORMED_CONSENT_REACTIVATION':
      case 'SUPERVISION_INFORMED_CONSENT_REACTIVATION':
        return undefined;
      default:
        return undefined;
    }
  }
}
