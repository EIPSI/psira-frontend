import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActionArgs, DEFAULT_PAGE_SIZE, SortField, TableColumn } from '@app/@shared/@modules/master-data/@types/list';
import { Filter } from '@app/@shared/@types/filter';
import { PageInfo, Paging } from '@app/@shared/@types/paging';
import { QuestionnaireBundlesColumns } from '@app/pages/administration/@tables/questionnaire-bundles.table';
import { Action } from 'rxjs/internal/scheduler/Action';
import { QuestionnaireBundlesService } from '../@services/questionnaire-bundles.service';
import { Sorting } from '@app/@shared/@types/sorting';
import { finalize } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DepartmentsService } from '@app/pages/patients-management/@services/departments.service';
import { Convert } from '@app/@shared/classes/convert';

enum ActionKey {
  EDIT,
  DELETE,
}

@Component({
  selector: 'app-questionnaire-bundles-list',
  templateUrl: './questionnaire-bundles-list.component.html',
  styleUrls: ['./questionnaire-bundles-list.component.scss'],
})
export class QuestionnaireBundlesListComponent implements OnInit {
  public data: Partial<any>[] | any;
  public columns: TableColumn<Partial<any>>[] = QuestionnaireBundlesColumns;
  public isLoading = false;
  public pageInfo: PageInfo;
  public actions: Action<ActionKey>[] | any = [];
  public listOfDepartments: any[] = [];
  private structureFilter = '';

  public bundlesRequestOptions: { paging: Paging; filter: Filter; sorting: Sorting[]; departmentIds?: number[] } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
    departmentIds: undefined,
  };

  constructor(
    private router: Router,
    private bundlesService: QuestionnaireBundlesService,
    private translate: TranslateService,
    private nzMessage: NzMessageService,
    private departmentsService: DepartmentsService
  ) {}

  ngOnInit(): void {
    this.getDepartments();
    this.actions = [
      { key: ActionKey.EDIT, title: 'Edit Bundle' },
      { key: ActionKey.DELETE, title: 'Delete Bundle' },
    ];
  }

  private getQuestionnaireBundles(): void {
    this.isLoading = true;
    this.bundlesService
      .getQuestionnairesBundles(this.bundlesRequestOptions)
      .pipe(finalize(() => (this.isLoading = false)))
      // tslint:disable
      .subscribe((x: any) => {
        const bundles = x.data?.getQuestionnaireBundles?.edges.map((q: any) => this.formatBundle(q.node)) || [];
        this.data = this.applyLocalFilters(bundles);
        this.pageInfo = x.data?.getQuestionnaireBundles?.pageInfo;
      });
  }

  private getDepartments(): void {
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
          this.listOfDepartments = allDepartments;

          if (data.departments.pageInfo?.hasNextPage) {
            this.loadDepartmentsPage(data.departments.pageInfo.endCursor, allDepartments);
            return;
          }

          this.getQuestionnaireBundles();
        },
        () => this.getQuestionnaireBundles()
      );
  }

  deleteQuestionnaireBundle(id: string) {
    this.bundlesService.deleteQuestionnaireBundle(id).subscribe(() => {
      const message$ = this.translate.get('bundles.deleted').subscribe((message) => {
        this.nzMessage.success(message, { nzDuration: 3000 });
      });
      message$.unsubscribe();
      this.getQuestionnaireBundles();
    });
  }

  public onPageChange(paging: Paging): void {
    this.bundlesRequestOptions.paging = paging;
    this.getQuestionnaireBundles();
  }

  public onSort(sorting: SortField<any>[]): void {
    this.bundlesRequestOptions.sorting = sorting.filter((sort) =>
      !['summary', 'departmentNames'].includes(String(sort.field))
    );
    this.getQuestionnaireBundles();
  }

  public onFilter(filter: Filter): void {
    const departmentSearch = this.extractTextFilter(filter, 'departmentNames');
    this.structureFilter = this.extractTextFilter(filter, 'summary').toLowerCase();
    this.bundlesRequestOptions.departmentIds = this.departmentIdsForSearch(departmentSearch);
    this.bundlesRequestOptions.filter = this.filterWithoutLocalFields(filter, ['departmentNames', 'summary']);
    this.getQuestionnaireBundles();
  }

  public onAction({ action, context: assessmentAdministration }: ActionArgs<any, ActionKey>): void {
    switch (action.key) {
      case ActionKey.EDIT:
        this.router.navigate([
          `/psira/questionnaire-management/create-questionnaire-bundle/${assessmentAdministration._id}`,
        ]);
        return;

      case ActionKey.DELETE:
        this.deleteQuestionnaireBundle(assessmentAdministration._id);
        return;
    }
  }

  private formatBundle(bundle: any): any {
    const structure = this.parseStructure(bundle.structureJson);
    const questionnaires = this.countQuestionnaires(structure);
    const groups = this.countGroups(structure);
    return {
      ...bundle,
      active: bundle.active !== false,
      activeStatus: bundle.active !== false
        ? { color: 'green', title: 'Activa' }
        : { color: 'red', title: 'Inactiva' },
      summary: `${questionnaires} questionnaires / ${groups} groups`,
      departmentNames: this.departmentNames(bundle.departmentIds),
    };
  }

  private departmentNames(departmentIds: number[] = []): string {
    return departmentIds
      .map((departmentId) =>
        this.listOfDepartments.find((department: any) => Number(department.id) === Number(departmentId))?.name
      )
      .filter(Boolean)
      .join(', ');
  }

  private departmentIdsForSearch(search: string): number[] | undefined {
    if (!search) return undefined;
    const matchingIds = this.listOfDepartments
      .filter((department: any) => department.name?.toLowerCase().includes(search.toLowerCase()))
      .map((department: any) => department.id);
    return matchingIds.length ? matchingIds : [-1];
  }

  private applyLocalFilters(bundles: any[]): any[] {
    if (!this.structureFilter) return bundles;
    return bundles.filter((bundle: any) => bundle.summary?.toLowerCase().includes(this.structureFilter));
  }

  private extractTextFilter(filter: Filter, fieldName: string): string {
    const condition = filter?.and?.find((item: any) => item[fieldName]);
    const value = condition?.[fieldName]?.iLike;
    return typeof value === 'string' ? value.replace(/%/g, '') : '';
  }

  private filterWithoutLocalFields(filter: Filter, localFields: string[]): Filter {
    const and = (filter?.and || []).filter((item: any) =>
      !localFields.some((fieldName) => Object.prototype.hasOwnProperty.call(item, fieldName))
    );
    return and.length ? { and } : {};
  }

  private parseStructure(value: string): any[] {
    try {
      return JSON.parse(value || '[]');
    } catch {
      return [];
    }
  }

  private countQuestionnaires(nodes: any[]): number {
    return (nodes || []).reduce(
      (count, node) => count + (node.type === 'QUESTIONNAIRE' ? 1 : this.countQuestionnaires(node.children || [])),
      0
    );
  }

  private countGroups(nodes: any[]): number {
    return (nodes || []).reduce(
      (count, node) => count + (node.type === 'QUESTIONNAIRE' ? 0 : 1 + this.countGroups(node.children || [])),
      0
    );
  }
}
