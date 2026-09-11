import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CalendarService } from '@app/pages/calendar/@services/calendar.service';
import { ClinicalSessionFollowUpSettings } from '@app/pages/calendar/@types/calendar';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-follow-up-settings',
  templateUrl: './follow-up-settings.component.html',
  styleUrls: ['./follow-up-settings.component.scss'],
})
export class FollowUpSettingsComponent implements OnInit {
  loading = false;
  saving = false;
  settings?: ClinicalSessionFollowUpSettings;

  constructor(
    private calendarService: CalendarService,
    private errorService: ErrorHandlerService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.calendarService
      .getClinicalSessionFollowUpSettings()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (settings: ClinicalSessionFollowUpSettings) => (this.settings = settings),
        (error: any) => this.errorService.handleError(error, { prefix: this.translate.instant('clinicalSettings.unableLoad') })
      );
  }

  saveSettings(): void {
    if (!this.settings) return;
    this.saving = true;
    this.calendarService
      .updateClinicalSessionFollowUpSettings({
        editWindowDays: Number(this.settings.editWindowDays) || 0,
        dashboardLookaheadDays: Number(this.settings.dashboardLookaheadDays) || 0,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        (settings: ClinicalSessionFollowUpSettings) => (this.settings = settings),
        (error: any) => this.errorService.handleError(error, { prefix: this.translate.instant('clinicalSettings.unableUpdate') })
      );
  }
}
