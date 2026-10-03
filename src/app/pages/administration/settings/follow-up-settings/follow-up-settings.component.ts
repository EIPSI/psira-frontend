import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { CalendarService } from '@app/pages/calendar/@services/calendar.service';
import { ClinicalSessionFollowUpSettings } from '@app/pages/calendar/@types/calendar';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '@app/pages/administration/@services/settings.service';
import { RolesService } from '@app/pages/administration/@services/roles.service';

@Component({
  selector: 'app-follow-up-settings',
  templateUrl: './follow-up-settings.component.html',
  styleUrls: ['./follow-up-settings.component.scss'],
})
export class FollowUpSettingsComponent implements OnInit {
  loading = false;
  saving = false;
  settings?: ClinicalSessionFollowUpSettings;
  roleOptions: Array<{ label: string; value: string }> = [];
  patientCaseManagerRoleCodes: string[] = [];
  therapistSupervisorRoleCodes: string[] = [];

  constructor(
    private calendarService: CalendarService,
    private settingsService: SettingsService,
    private rolesService: RolesService,
    private errorService: ErrorHandlerService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    forkJoin({
      clinical: this.calendarService.getClinicalSessionFollowUpSettings(),
      general: this.settingsService.settings(),
      roles: this.rolesService.roles({ paging: { first: 50 }, sorting: [{ field: 'name', direction: 'ASC' }] as any }),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ clinical, general, roles }: any) => {
          this.settings = clinical;
          this.patientCaseManagerRoleCodes = general.data?.settings?.patientCaseManagerRoleCodes || ['SUPER_ADMIN', 'THERAPIST'];
          this.therapistSupervisorRoleCodes = general.data?.settings?.therapistSupervisorRoleCodes || ['SUPERVISOR'];
          this.roleOptions = (roles.data?.roles?.edges || []).map((edge: any) => ({
            label: edge.node.name,
            value: edge.node.code,
          }));
        },
        (error: any) => this.errorService.handleError(error, { prefix: this.translate.instant('clinicalSettings.unableLoad') })
      );
  }

  saveSettings(): void {
    if (!this.settings) return;
    this.saving = true;
    forkJoin({
      clinical: this.calendarService.updateClinicalSessionFollowUpSettings({
        editWindowDays: Number(this.settings.editWindowDays) || 0,
        dashboardLookaheadDays: Number(this.settings.dashboardLookaheadDays) || 0,
      }),
      general: this.settingsService.updateSetting({
        patientCaseManagerRoleCodes: this.patientCaseManagerRoleCodes,
        therapistSupervisorRoleCodes: this.therapistSupervisorRoleCodes,
      } as any),
    })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        ({ clinical }: any) => (this.settings = clinical),
        (error: any) => this.errorService.handleError(error, { prefix: this.translate.instant('clinicalSettings.unableUpdate') })
      );
  }
}
