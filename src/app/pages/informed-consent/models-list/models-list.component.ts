import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionKey } from '@app/@shared/@types/permission';
import { Action, ActionArgs, SortField, TableColumn } from '@shared/@modules/master-data/@types/list';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { InformedConsentService } from '../@services/informed-consent.service';
import { InformedConsentKindLabel, InformedConsentModel } from '../@types/informed-consent';

enum ActionKey {
  EDIT,
  DUPLICATE,
  DELETE,
}

@Component({
  selector: 'app-informed-consent-models-list',
  templateUrl: './models-list.component.html',
  styleUrls: ['./models-list.component.scss'],
})
export class InformedConsentModelsListComponent implements OnInit {
  PK = PermissionKey;
  loading = false;
  models: InformedConsentModel[] = [];
  filteredModels: any[] = [];
  kindLabel = InformedConsentKindLabel;
  searchString = '';
  sortFields: SortField<any>[] = [];
  actions: Action<ActionKey>[] = [];
  columns: TableColumn<any>[] = [
    { title: 'core.name', translationPath: 'core.name', name: 'name', sort: true, filterField: { type: 'text', value: undefined } as any },
    { title: 'informedConsent.currentVersion', translationPath: 'informedConsent.currentVersion', name: 'currentVersionTitle', sort: true },
    { title: 'departments.departments', translationPath: 'departments.departments', name: 'departmentNames', sort: true },
    { title: 'core.status', translationPath: 'core.status', name: 'formattedStatus', render: 'tag', sort: true },
  ];

  constructor(
    private service: InformedConsentService,
    private router: Router,
    private modal: NzModalService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.setActions();
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.getModels().pipe(finalize(() => (this.loading = false))).subscribe(
      (models) => {
        this.models = models || [];
        this.applyLocalFilters();
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableLoadModels') })
    );
  }

  open(model: InformedConsentModel): void {
    this.router.navigate(['/psira/informed-consent/models', model.id]);
  }

  create(): void {
    this.router.navigate(['/psira/informed-consent/models/new']);
  }

  departmentNames(model: InformedConsentModel): string {
    return model.departments?.length
      ? model.departments.map((department) => department.name).join(', ')
      : this.translate.instant('dashboard.general');
  }

  delete(model: InformedConsentModel): void {
    this.modal.confirm({
      nzTitle: this.translate.instant('informedConsent.deleteModel'),
      nzContent: this.translate.instant('informedConsent.deleteModelConfirm'),
      nzOkText: this.translate.instant('core.delete'),
      nzOkDanger: true,
      nzOnOk: () => this.service.deleteModel(model.id).subscribe(
        () => this.load(),
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableDeleteModel') })
      ),
    });
  }

  duplicate(model: InformedConsentModel): void {
    this.service.duplicateModel(model.id).subscribe(
      (copy) => this.router.navigate(['/psira/informed-consent/models', copy.id]),
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableDuplicateModel') })
    );
  }

  onSearch(searchString: string): void {
    this.searchString = searchString || '';
    this.applyLocalFilters();
  }

  resetFilters(): void {
    this.searchString = '';
    this.applyLocalFilters();
  }

  onSort(sortFields: SortField<any>[]): void {
    this.sortFields = sortFields || [];
    this.applyLocalFilters();
  }

  onAction({ action, context }: ActionArgs<any, ActionKey>): void {
    if (action.key === ActionKey.EDIT) this.open(context.source);
    if (action.key === ActionKey.DUPLICATE) this.duplicate(context.source);
    if (action.key === ActionKey.DELETE) this.delete(context.source);
  }

  private setActions(): void {
    if (!this.perms.permissionsOnly(PermissionKey.INFORMED_CONSENT_MODELS_EDIT_DEPARTMENT)) return;
    this.actions = [
      { key: ActionKey.EDIT, title: this.translate.instant('core.edit') },
      { key: ActionKey.DUPLICATE, title: this.translate.instant('core.duplicate') },
      { key: ActionKey.DELETE, title: this.translate.instant('core.delete') },
    ];
  }

  private applyLocalFilters(): void {
    const search = this.searchString.trim().toLowerCase();
    const rows = this.models
      .map((model) => ({
        ...model,
        source: model,
        currentVersionTitle: model.currentPublishedVersion?.title || this.translate.instant('informedConsent.unpublished'),
        departmentNames: this.departmentNames(model),
        formattedStatus: {
          color: model.active ? 'green' : 'default',
          title: this.translate.instant(model.active ? 'core.active' : 'core.inactive'),
        },
      }))
      .filter((model) => !search || [
        model.name,
        model.description,
        model.currentVersionTitle,
        model.departmentNames,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)));
    this.filteredModels = this.sortRows(rows);
  }

  private sortRows(rows: any[]): any[] {
    const activeSort = this.sortFields.find((sort) => !!sort.direction);
    if (!activeSort) return rows;
    const direction = activeSort.direction === 'ASC' ? 1 : -1;
    return [...rows].sort((a, b) => this.compareValues(a[activeSort.field], b[activeSort.field]) * direction);
  }

  private compareValues(a: any, b: any): number {
    const left = a?.title || a || '';
    const right = b?.title || b || '';
    const leftDate = Date.parse(left);
    const rightDate = Date.parse(right);
    if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) return leftDate - rightDate;
    return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
  }
}
