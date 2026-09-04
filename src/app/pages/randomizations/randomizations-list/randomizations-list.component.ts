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
import { RandomizationRuleModel } from '../@models/randomization.model';
import { RandomizationsTable } from '../@tables/randomizations.table';
import { RandomizationRule } from '../@types/randomization';
import { RandomizationsService } from '../@services/randomizations.service';

enum ActionKey {
  EDIT,
  DUPLICATE,
  TOGGLE_ACTIVE,
  DELETE,
}

@Component({
  selector: 'app-randomizations-list',
  templateUrl: './randomizations-list.component.html',
  styleUrls: ['./randomizations-list.component.scss'],
})
export class RandomizationsListComponent implements OnInit {
  public PK = PermissionKey;
  public randomizations: RandomizationRule[] = [];
  public columns: TableColumn<RandomizationRule>[] = RandomizationsTable;
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
    private randomizationsService: RandomizationsService,
    private errorService: ErrorHandlerService,
    private modalService: NzModalService,
    public perms: AppPermissionsService
  ) {}

  ngOnInit(): void {
    this.setActions();
    this.loadRandomizations();
  }

  public onPageChange(paging: Paging): void {
    this.requestOptions.paging = paging;
    this.loadRandomizations();
  }

  public onSort(sorting: SortField<RandomizationRule>[]): void {
    this.requestOptions.sorting = sorting.filter((sort) =>
      !['departmentNames', 'itemCount'].includes(String(sort.field))
    ) as Sorting[];
    this.loadRandomizations();
  }

  public onFilter(filter: Filter): void {
    this.requestOptions.filter = filter;
    this.loadRandomizations();
  }

  public onSearch(searchString: string): void {
    this.requestOptions.filter = searchString
      ? {
          or: [{ name: { iLike: `%${searchString}%` } }],
        }
      : {};
    this.loadRandomizations();
  }

  public onAction({ action, context: randomization }: ActionArgs<RandomizationRule, ActionKey>): void {
    switch (action.key) {
      case ActionKey.EDIT:
        this.openRandomization(randomization);
        return;
      case ActionKey.DUPLICATE:
        this.duplicateRandomization(randomization);
        return;
      case ActionKey.TOGGLE_ACTIVE:
        this.toggleActive(randomization);
        return;
      case ActionKey.DELETE:
        this.deleteRandomization(randomization);
        return;
    }
  }

  public openRandomization(randomization: RandomizationRule): void {
    this.router.navigate(['/psira/randomizations', randomization.id]);
  }

  private duplicateRandomization(randomization: RandomizationRule): void {
    this.randomizationsService.duplicateRandomization(randomization.id).subscribe(
      () => this.loadRandomizations(),
      (error) => this.errorService.handleError(error, { prefix: 'Unable to duplicate randomization' })
    );
  }

  private toggleActive(randomization: RandomizationRule): void {
    this.randomizationsService.setActive(randomization.id, !randomization.active).subscribe(
      () => this.loadRandomizations(),
      (error) => this.errorService.handleError(error, { prefix: 'Unable to update randomization' })
    );
  }

  private deleteRandomization(randomization: RandomizationRule): void {
    this.modalService.confirm({
      nzTitle: 'Eliminar randomización',
      nzContent: `La randomización "${randomization.name}" se eliminará.`,
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzOnOk: () =>
        this.randomizationsService.deleteRandomization(randomization.id).subscribe(
          () => this.loadRandomizations(),
          (error) => this.errorService.handleError(error, { prefix: 'Unable to delete randomization' })
        ),
    });
  }

  private loadRandomizations(): void {
    this.loading = true;
    this.randomizationsService
      .getRandomizations(this.requestOptions)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ edges, pageInfo }) => {
          this.randomizations = edges.map((edge: any) => RandomizationRuleModel.fromJson(edge.node));
          this.pageInfo = pageInfo;
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load randomizations' })
      );
  }

  private setActions(): void {
    if (!this.perms.permissionsOnly(PermissionKey.RANDOMIZATIONS_EDIT_DEPARTMENT)) return;

    this.actions = [
      { key: ActionKey.EDIT, title: 'Ver / editar' },
      { key: ActionKey.DUPLICATE, title: 'Duplicar' },
      { key: ActionKey.TOGGLE_ACTIVE, title: 'Activar / desactivar' },
      { key: ActionKey.DELETE, title: 'Eliminar' },
    ];
  }
}
