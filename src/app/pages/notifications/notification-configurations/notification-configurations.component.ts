import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionKey } from '@app/@shared/@types/permission';
import { Action, ActionArgs, TableColumn } from '@shared/@modules/master-data/@types/list';
import { Filter } from '@shared/@types/filter';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { finalize } from 'rxjs/operators';
import { NotificationConfigurationModel } from '../@models/notification-configuration.model';
import { NotificationsService } from '../@services/notifications.service';
import { NotificationConfigurationsTable } from '../@tables/notification-configurations.table';
import { NotificationConfiguration } from '../@types/notification';

enum ActionKey {
  EDIT,
  DUPLICATE,
  DELETE,
}

@Component({
  selector: 'app-notification-configurations',
  templateUrl: './notification-configurations.component.html',
  styleUrls: ['./notification-configurations.component.scss'],
})
export class NotificationConfigurationsComponent implements OnInit {
  public PK = PermissionKey;
  public configurations: NotificationConfiguration[] = [];
  public filteredConfigurations: NotificationConfiguration[] = [];
  public columns: TableColumn<NotificationConfiguration>[] = NotificationConfigurationsTable;
  public loading = false;
  public actions: Action<ActionKey>[] = [];
  public searchString = '';
  public filter: Filter = {};

  constructor(
    private router: Router,
    private notificationsService: NotificationsService,
    private modalService: NzModalService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService
  ) {}

  ngOnInit(): void {
    this.setActions();
    this.loadConfigurations();
  }

  public onSearch(searchString: string): void {
    this.searchString = searchString || '';
    this.applyLocalFilters();
  }

  public onFilter(filter: Filter): void {
    this.filter = filter || {};
    this.applyLocalFilters();
  }

  public onAction({ action, context: configuration }: ActionArgs<NotificationConfiguration, ActionKey>): void {
    if (action.key === ActionKey.EDIT) {
      this.openConfiguration(configuration);
      return;
    }
    if (action.key === ActionKey.DELETE) {
      this.deleteConfiguration(configuration);
      return;
    }
    if (action.key === ActionKey.DUPLICATE) {
      this.duplicateConfiguration(configuration);
    }
  }

  public openConfiguration(configuration: NotificationConfiguration): void {
    this.router.navigate(['/psira/notifications/administration', configuration.id]);
  }

  private loadConfigurations(): void {
    this.loading = true;
    this.notificationsService
      .getConfigurations()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (configurations) => {
          this.configurations = (configurations || []).map((configuration) =>
            NotificationConfigurationModel.fromJson(configuration)
          );
          this.applyLocalFilters();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load notification configurations' })
      );
  }

  private applyLocalFilters(): void {
    const search = this.searchString.trim().toLowerCase();
    this.filteredConfigurations = this.configurations.filter((configuration) => {
      const matchesSearch =
        !search ||
        [
          configuration.departmentName,
          configuration.channelLabel,
          configuration.eventLabel,
          configuration.recipientRoleName,
          configuration.mailTemplateName,
          configuration.notes,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      return matchesSearch && this.matchesTableFilter(configuration);
    });
  }

  private matchesTableFilter(configuration: NotificationConfiguration): boolean {
    const filter: any = this.filter || {};
    return Object.keys(filter).every((field) => {
      const condition = filter[field];
      const value = (configuration as any)[field];
      if (!condition || value === undefined || value === null) return true;
      if (condition.eq !== undefined) return value === condition.eq;
      if (condition.iLike) {
        return String(value).toLowerCase().includes(String(condition.iLike).replace(/%/g, '').toLowerCase());
      }
      return true;
    });
  }

  private deleteConfiguration(configuration: NotificationConfiguration): void {
    this.modalService.confirm({
      nzTitle: 'Eliminar configuración',
      nzContent: 'La configuración se eliminará y dejará de activar notificaciones para esa combinación.',
      nzOkText: 'Eliminar',
      nzOkDanger: true,
      nzOnOk: () =>
        this.notificationsService.deleteConfiguration(configuration.id).subscribe(
          () => this.loadConfigurations(),
          (error) => this.errorService.handleError(error, { prefix: 'Unable to delete notification configuration' })
        ),
    });
  }

  private duplicateConfiguration(configuration: NotificationConfiguration): void {
    this.router.navigate(['/psira/notifications/administration/new'], {
      queryParams: { duplicateFrom: configuration.id },
    });
  }

  private setActions(): void {
    if (!this.perms.permissionsOnly(PermissionKey.NOTIFICATIONS_EDIT_DEPARTMENT)) return;
    this.actions = [
      { key: ActionKey.EDIT, title: 'Ver / editar' },
      { key: ActionKey.DUPLICATE, title: 'Duplicar' },
      { key: ActionKey.DELETE, title: 'Eliminar' },
    ];
  }

  public resetFilters(): void {
    this.searchString = '';
    this.filter = {};
    this.applyLocalFilters();
  }
}
