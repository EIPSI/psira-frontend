import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CalendarService } from '@app/pages/calendar/@services/calendar.service';
import { ClinicalSessionFollowUpSettings } from '@app/pages/calendar/@types/calendar';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { TranslateService } from '@ngx-translate/core';
import { RolesService } from '@app/pages/administration/@services/roles.service';
import { DepartmentsService } from '@app/pages/administration/@services/departments.service';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { PermissionKey } from '@shared/@types/permission';

@Component({
  selector: 'app-follow-up-settings',
  templateUrl: './follow-up-settings.component.html',
  styleUrls: ['./follow-up-settings.component.scss'],
})
export class FollowUpSettingsComponent implements OnInit {
  loading = false;
  saving = false;
  settings?: ClinicalSessionFollowUpSettings;
  departmentId = 0;
  departments: Array<{ id: number; name: string }> = [];
  roleOptions: Array<{ label: string; value: string }> = [];
  patientCaseManagerRoleCodes: string[] = [];
  therapistSupervisorRoleCodes: string[] = [];
  globalAccess = false;

  constructor(
    private calendarService: CalendarService,
    private rolesService: RolesService,
    private departmentsService: DepartmentsService,
    private errorService: ErrorHandlerService,
    private translate: TranslateService,
    public perms: AppPermissionsService
  ) {}

  ngOnInit(): void {
    this.globalAccess = this.perms.permissionsOnly([PermissionKey.SETTINGS_EDIT_ALL, PermissionKey.CLINICAL_SETTINGS_EDIT_ALL]);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.departments = user.departments || [];
    if (!this.globalAccess) this.departmentId = this.departments[0]?.id || 0;
    else this.departmentsService.departments({ paging: { first: 50 } }).subscribe(
      ({ data }: any) => this.departments = data.departments.edges.map((edge: any) => edge.node),
      (error) => this.errorService.handleError(error)
    );
    this.rolesService.roles({ paging: { first: 50 } }).subscribe(
      ({ data }: any) => this.roleOptions = data.roles.edges.filter((edge: any) => edge.node.code).map((edge: any) => ({
        label: edge.node.name, value: edge.node.code,
      })),
      (error) => this.errorService.handleError(error)
    );
    this.loadSettings();
  }

  loadSettings(): void {
    if (!this.globalAccess && !this.departmentId) { this.settings = undefined; return; }
    this.loading = true;
    const selectedDepartment = this.departmentId;
    this.calendarService.getClinicalSessionFollowUpSettings(this.departmentId || undefined)
      .pipe(finalize(() => this.loading = false)).subscribe(
        (settings) => {
          if (selectedDepartment !== this.departmentId) return;
          this.settings = settings;
          this.patientCaseManagerRoleCodes = settings.patientCaseManagerRoleCodes || [];
          this.therapistSupervisorRoleCodes = settings.therapistSupervisorRoleCodes || [];
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('clinicalSettings.unableLoad') })
      );
  }

  saveSettings(): void {
    if (!this.settings || (!this.globalAccess && !this.departmentId)) return;
    this.saving = true;
    this.calendarService.updateClinicalSessionFollowUpSettings({
      departmentId: this.departmentId || undefined,
      editWindowDays: Number(this.settings.editWindowDays),
      dashboardLookaheadDays: Number(this.settings.dashboardLookaheadDays),
      patientCaseManagerRoleCodes: this.patientCaseManagerRoleCodes,
      therapistSupervisorRoleCodes: this.therapistSupervisorRoleCodes,
    }).pipe(finalize(() => this.saving = false)).subscribe(
      (settings) => this.settings = settings,
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('clinicalSettings.unableUpdate') })
    );
  }
}
