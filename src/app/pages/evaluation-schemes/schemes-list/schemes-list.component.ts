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
import { EvaluationSchemeModel } from '../@models/evaluation-scheme.model';
import { EvaluationSchemesTable } from '../@tables/evaluation-schemes.table';
import { EvaluationScheme } from '../@types/evaluation-scheme';
import { EvaluationSchemesService } from '../@services/evaluation-schemes.service';

enum ActionKey {
  EDIT,
  TOGGLE_ACTIVE,
  DISCARD,
}

@Component({
  selector: 'app-schemes-list',
  templateUrl: './schemes-list.component.html',
  styleUrls: ['./schemes-list.component.scss'],
})
export class SchemesListComponent implements OnInit {
  public PK = PermissionKey;
  public schemes: EvaluationScheme[] = [];
  public columns: TableColumn<EvaluationScheme>[] = EvaluationSchemesTable;
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
    private schemesService: EvaluationSchemesService,
    private errorService: ErrorHandlerService,
    private modalService: NzModalService,
    public perms: AppPermissionsService
  ) {}

  ngOnInit(): void {
    this.setActions();
    this.loadSchemes();
  }

  public onPageChange(paging: Paging): void {
    this.requestOptions.paging = paging;
    this.loadSchemes();
  }

  public onSort(sorting: SortField<EvaluationScheme>[]): void {
    this.requestOptions.sorting = sorting as Sorting[];
    this.loadSchemes();
  }

  public onFilter(filter: Filter): void {
    this.requestOptions.filter = filter;
    this.loadSchemes();
  }

  public onSearch(searchString: string): void {
    this.requestOptions.filter = searchString
      ? {
          or: [
            { name: { iLike: `%${searchString}%` } },
            { description: { iLike: `%${searchString}%` } },
          ],
        }
      : {};
    this.loadSchemes();
  }

  public onAction({ action, context: scheme }: ActionArgs<EvaluationScheme, ActionKey>): void {
    switch (action.key) {
      case ActionKey.EDIT:
        this.openScheme(scheme);
        return;
      case ActionKey.TOGGLE_ACTIVE:
        this.toggleActive(scheme);
        return;
      case ActionKey.DISCARD:
        this.discardScheme(scheme);
        return;
    }
  }

  public openScheme(scheme: EvaluationScheme): void {
    this.router.navigate(['/psira/evaluation-schemes', scheme.id]);
  }

  private toggleActive(scheme: EvaluationScheme): void {
    this.schemesService.updateScheme({ id: scheme.id, active: !scheme.active }).subscribe(
      () => this.loadSchemes(),
      (error) => this.errorService.handleError(error, { prefix: 'Unable to update scheme' })
    );
  }

  private discardScheme(scheme: EvaluationScheme): void {
    this.modalService.confirm({
      nzTitle: 'Eliminar esquema',
      nzContent: `El esquema "${scheme.name}" se eliminará. Las ocurrencias y evaluaciones ya creadas quedarán desvinculadas del esquema.`,
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzOnOk: () =>
        this.schemesService.deleteScheme(scheme.id).subscribe(
          () => this.loadSchemes(),
          (error) => this.errorService.handleError(error, { prefix: 'Unable to delete scheme' })
        ),
    });
  }

  private loadSchemes(): void {
    this.loading = true;
    this.schemesService
      .getSchemes(this.requestOptions)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ edges, pageInfo }) => {
          this.schemes = edges.map((edge: any) => EvaluationSchemeModel.fromJson(edge.node));
          this.pageInfo = pageInfo;
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load schemes' })
      );
  }

  private setActions(): void {
    if (!this.perms.permissionsOnly(PermissionKey.MANAGE_ASSESSMENTS)) return;

    this.actions = [
      { key: ActionKey.EDIT, title: 'Edit Scheme' },
      { key: ActionKey.TOGGLE_ACTIVE, title: 'Activate/Deactivate' },
      { key: ActionKey.DISCARD, title: 'Eliminar' },
    ];
  }
}
