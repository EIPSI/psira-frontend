import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { PermissionKey } from '@shared/@types/permission';
import { DepartmentsService } from '../@services/departments.service';
import { Component, OnInit } from '@angular/core';
import { Disclaimers } from '@app/pages/administration/@types/disclaimers';
import { TableColumn } from '@shared/@modules/master-data/@types/list';
import { DisclaimersColumns } from '@app/pages/administration/@tables/disclaimers.table';
import { finalize } from 'rxjs/operators';
import { DisclaimersService } from '@app/pages/administration/@services/disclaimers.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { Convert } from '../../../@shared/classes/convert';
import { UpdateOneUserInput, User } from '@app/pages/user-management/@types/user';
import { UsersService } from '@app/pages/user-management/@services/users.service';
import { AuthService } from '@app/auth/auth.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';

@Component({
  selector: 'app-disclaimers',
  templateUrl: './disclaimers.component.html',
  styleUrls: ['./disclaimers.component.scss'],
})
export class DisclaimersComponent implements OnInit {
  departmentId = 0;
  globalAccess = false;
  departments: Array<{ id: number; name: string }> = [];
  public data: Partial<Disclaimers>[];
  public columns: TableColumn<Partial<Disclaimers>>[] = DisclaimersColumns;
  public disclaimers: Disclaimers;
  public isLoading = false;
  public acceptedTerm = true;
  user: User;
  public description = '';
  public editorConfig: AngularEditorConfig = {
    minHeight: '320px',
    editable: true,
    sanitize: false,
  };

  // form properties
  public showCreateDisclaimer = false;
  public disclaimer: Disclaimers;

  constructor(
    private disclaimersService: DisclaimersService,
    private errorService: ErrorHandlerService,
    private authService: AuthService,
    private usersService: UsersService,
    private perms: AppPermissionsService,
    private departmentsService: DepartmentsService
  ) {}

  ngOnInit(): void {
    this.globalAccess = this.perms.permissionsOnly(PermissionKey.SETTINGS_EDIT_ALL);
    this.departments = JSON.parse(localStorage.getItem('user') || '{}').departments || [];
    if (!this.globalAccess) this.departmentId = this.departments[0]?.id || 0;
    else this.departmentsService.departments({ paging: { first: 50 } }).subscribe(({ data }: any) => {
      this.departments = data.departments.edges.map((edge: any) => edge.node);
    }, (error) => this.errorService.handleError(error));
    this.getDisclaimers();
    this.getUser();
  }

  public openCreatePanel(disclaimer?: Disclaimers): void {
    if (disclaimer) {
      this.disclaimer = disclaimer;
      this.description = disclaimer.description || '';
    }
    this.showCreateDisclaimer = true;
  }

  public closeCreatePanel(): void {
    this.disclaimer = null;
    this.description = '';
    this.showCreateDisclaimer = false;
  }

  public handleRowClick(event: any) {
    this.openCreatePanel(event);
  }

  getUser() {
    this.authService.getUserProfile().subscribe(
      ({ data }) => {
        this.user = data.getUserProfile;
      },
      (err) => this.errorService.handleError(err, { prefix: 'Unable to get user profile' })
    );
  }

  updateUser() {
    const userInput: UpdateOneUserInput = {
      id: this.user.id,
      update: { acceptedTerm: false },
    };
    this.isLoading = true;
    this.usersService
      .updateUserAcceptedTerm(userInput)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        async ({ data }) => {},
        (error) => {
          this.errorService.handleError(error, {});
        }
      );
  }

  public updateDisclaimer() {
    const sendResult = { departmentId: this.departmentId || undefined, type: this.disclaimer.type, description: this.description || '' };

    return this.disclaimersService
      .updateDisclaimer(sendResult)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }) => {
          if (this.disclaimer.type === 'loginDisclaimer') {
            this.updateUser();
          }
          this.closeCreatePanel();
          this.getDisclaimers();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to update disclaimer' })
      );
  }

  getDisclaimers(): void {
    this.isLoading = true;
    this.disclaimersService
      .disclaimers(this.departmentId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.data = data.disclaimers.map((disclaimers: any) => Convert.toFormattedDisclaimer(disclaimers));
        },
        (err) => this.errorService.handleError(err, { prefix: 'Unable to load departments' })
      );
  }
}
