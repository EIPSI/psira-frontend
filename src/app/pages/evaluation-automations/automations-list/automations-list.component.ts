import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionKey } from '@app/@shared/@types/permission';
import {
  Action,
  ActionArgs,
  DEFAULT_PAGE_SIZE,
  SortField,
  TableColumn,
} from '@shared/@modules/master-data/@types/list';
import { Filter } from '@shared/@types/filter';
import { PageInfo, Paging } from '@shared/@types/paging';
import { Sorting } from '@shared/@types/sorting';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { finalize } from 'rxjs/operators';
import { EvaluationAutomationModel } from '../@models/evaluation-automation.model';
import { EvaluationAutomationsService } from '../@services/evaluation-automations.service';
import { EvaluationAutomationsTable } from '../@tables/evaluation-automations.table';
import { EvaluationAutomation } from '../@types/evaluation-automation';

enum ActionKey {
  EDIT,
  DUPLICATE,
  TOGGLE_ACTIVE,
  DELETE,
}

@Component({
  selector: 'app-automations-list',
  templateUrl: './automations-list.component.html',
  styleUrls: ['./automations-list.component.scss'],
})
export class AutomationsListComponent implements OnInit {
  public PK = PermissionKey;
  public automations: EvaluationAutomation[] = [];
  public columns: TableColumn<EvaluationAutomation>[] = EvaluationAutomationsTable;
  public loading = false;
  public pageInfo: PageInfo;
  public actions: Action<ActionKey>[] = [];
  public requestOptions: { paging: Paging; filter: Filter; sorting: Sorting[] } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [{ field: 'createdAt', direction: 'DESC' }],
  };

  constructor(
    private router: Router,
    private automationsService: EvaluationAutomationsService,
    private errorService: ErrorHandlerService,
    private modalService: NzModalService,
    public perms: AppPermissionsService
  ) {}

  ngOnInit(): void {
    this.setActions();
    this.loadAutomations();
  }

  public onPageChange(paging: Paging): void {
    this.requestOptions.paging = paging;
    this.loadAutomations();
  }

  public onSort(sorting: SortField<EvaluationAutomation>[]): void {
    this.requestOptions.sorting = sorting.filter((sort) =>
      !['departmentNames', 'roleName', 'resourceName', 'delayLabel'].includes(String(sort.field))
    ) as Sorting[];
    this.loadAutomations();
  }

  public onFilter(filter: Filter): void {
    this.requestOptions.filter = filter;
    this.loadAutomations();
  }

  public onSearch(searchString: string): void {
    this.requestOptions.filter = searchString
      ? {
          or: [
            { title: { iLike: `%${searchString}%` } },
            { description: { iLike: `%${searchString}%` } },
          ],
        }
      : {};
    this.loadAutomations();
  }

  public onAction({ action, context: automation }: ActionArgs<EvaluationAutomation, ActionKey>): void {
    switch (action.key) {
      case ActionKey.EDIT:
        this.openAutomation(automation);
        return;
      case ActionKey.DUPLICATE:
        this.duplicateAutomation(automation);
        return;
      case ActionKey.TOGGLE_ACTIVE:
        this.toggleActive(automation);
        return;
      case ActionKey.DELETE:
        this.deleteAutomation(automation);
        return;
    }
  }

  public openAutomation(automation: EvaluationAutomation): void {
    this.router.navigate(['/psira/evaluation-automations', automation.id]);
  }

  private duplicateAutomation(automation: EvaluationAutomation): void {
    this.automationsService.duplicateAutomation(automation.id).subscribe(
      () => this.loadAutomations(),
      (error) => this.errorService.handleError(error, { prefix: 'Unable to duplicate automation' })
    );
  }

  private toggleActive(automation: EvaluationAutomation): void {
    this.automationsService.setActive(automation.id, !automation.active).subscribe(
      () => this.loadAutomations(),
      (error) => this.errorService.handleError(error, { prefix: 'Unable to update automation' })
    );
  }

  private deleteAutomation(automation: EvaluationAutomation): void {
    this.modalService.confirm({
      nzTitle: 'Eliminar automatización',
      nzContent: `La automatización "${automation.title}" se eliminará. Las evaluaciones o esquemas ya programados persistirán.`,
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzOnOk: () =>
        this.automationsService.deleteAutomation(automation.id).subscribe(
          () => this.loadAutomations(),
          (error) => this.errorService.handleError(error, { prefix: 'Unable to delete automation' })
        ),
    });
  }

  private loadAutomations(): void {
    this.loading = true;
    this.automationsService
      .getAutomations(this.requestOptions)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ edges, pageInfo }) => {
          this.automations = edges.map((edge: any) => EvaluationAutomationModel.fromJson(edge.node));
          this.pageInfo = pageInfo;
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load automations' })
      );
  }

  private setActions(): void {
    if (
      !this.perms.permissionsOnly(PermissionKey.AUTOMATIONS_EDIT_DEPARTMENT) &&
      !this.perms.permissionsOnly(PermissionKey.AUTOMATIONS_EDIT_ALL)
    ) {
      return;
    }

    this.actions = [
      { key: ActionKey.EDIT, title: 'Ver / editar' },
      { key: ActionKey.DUPLICATE, title: 'Duplicar' },
      { key: ActionKey.TOGGLE_ACTIVE, title: 'Activar / desactivar' },
      { key: ActionKey.DELETE, title: 'Eliminar' },
    ];
  }
}
