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
import {
  InformedConsentManagement,
  InformedConsentStatusLabel,
  InformedConsentTriggerLabel,
} from '../@types/informed-consent';

enum ActionKey {
  EDIT,
  DUPLICATE,
  DELETE,
}

@Component({
  selector: 'app-informed-consent-management-list',
  templateUrl: './management-list.component.html',
  styleUrls: ['./management-list.component.scss'],
})
export class InformedConsentManagementListComponent implements OnInit {
  PK = PermissionKey;
  loading = false;
  managements: InformedConsentManagement[] = [];
  filteredManagements: any[] = [];
  statusLabel = InformedConsentStatusLabel;
  triggerLabel = InformedConsentTriggerLabel;
  searchString = '';
  sortFields: SortField<any>[] = [];
  actions: Action<ActionKey>[] = [];
  columns: TableColumn<any>[] = [
    { title: 'core.title', translationPath: 'core.title', name: 'title', sort: true, filterField: { type: 'text', value: undefined } as any },
    { title: 'informedConsent.model', translationPath: 'informedConsent.model', name: 'modelName', sort: true },
    { title: 'informedConsent.trigger', translationPath: 'informedConsent.trigger', name: 'triggerLabel', sort: true },
    { title: 'roles.roles', translationPath: 'roles.roles', name: 'roleNames', sort: true },
    { title: 'departments.departments', translationPath: 'departments.departments', name: 'departmentNames', sort: true },
    { title: 'informedConsent.requiresResponse', translationPath: 'informedConsent.requiresResponse', name: 'formattedMandatory', render: 'tag', sort: true },
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
    this.service.getManagements().pipe(finalize(() => (this.loading = false))).subscribe(
      (managements) => {
        this.managements = managements || [];
        this.applyLocalFilters();
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableLoadManagement') })
    );
  }

  open(item: InformedConsentManagement): void {
    this.router.navigate(['/psira/informed-consent/management', item.id]);
  }

  create(): void {
    this.router.navigate(['/psira/informed-consent/management/new']);
  }

  duplicate(item: InformedConsentManagement): void {
    this.service.duplicateManagement(item.id).subscribe(
      (copy) => this.router.navigate(['/psira/informed-consent/management', copy.id]),
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableDuplicateManagement') })
    );
  }

  delete(item: InformedConsentManagement): void {
    this.modal.confirm({
      nzTitle: this.translate.instant('informedConsent.deleteManagement'),
      nzContent: this.translate.instant('informedConsent.deleteManagementConfirm'),
      nzOkText: this.translate.instant('core.delete'),
      nzOkDanger: true,
      nzOnOk: () => this.service.deleteManagement(item.id).subscribe(
        () => this.load(),
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableDeleteManagement') })
      ),
    });
  }

  names(items: Array<{ name: string }>): string {
    return items?.length ? items.map((item) => item.name).join(', ') : this.translate.instant('core.all');
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
    if (!this.perms.permissionsOnly(PermissionKey.INFORMED_CONSENT_MANAGEMENT_EDIT_DEPARTMENT)) return;
    this.actions = [
      { key: ActionKey.EDIT, title: this.translate.instant('core.edit') },
      { key: ActionKey.DUPLICATE, title: this.translate.instant('core.duplicate') },
      { key: ActionKey.DELETE, title: this.translate.instant('core.delete') },
    ];
  }

  private applyLocalFilters(): void {
    const search = this.searchString.trim().toLowerCase();
    const rows = this.managements
      .map((item) => ({
        ...item,
        source: item,
        modelName: item.model?.name || '',
        triggerLabel: this.translate.instant(this.triggerLabel[item.trigger] || item.trigger),
        roleNames: item.appliesToAllRoles ? this.translate.instant('core.all') : this.names(item.roles),
        departmentNames: item.appliesToAllDepartments ? this.translate.instant('core.all') : this.names(item.departments),
        formattedMandatory: { color: item.mandatory ? 'red' : 'blue', title: this.translate.instant(item.mandatory ? 'core.yes' : 'core.no') },
        formattedStatus: { color: item.active ? 'green' : 'default', title: this.translate.instant(this.statusLabel[item.status] || item.status) },
      }))
      .filter((item) => !search || [
        item.title,
        item.description,
        item.modelName,
        item.triggerLabel,
        item.roleNames,
        item.departmentNames,
        item.formattedStatus.title,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)));
    this.filteredManagements = this.sortRows(rows);
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
