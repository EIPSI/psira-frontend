import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CalendarService } from '@app/pages/calendar/@services/calendar.service';
import { ClinicalSessionFollowUpSettings } from '@app/pages/calendar/@types/calendar';
import { ErrorHandlerService } from '@shared/services/error-handler.service';

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
    private errorService: ErrorHandlerService
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
        (error: any) => this.errorService.handleError(error, { prefix: 'Unable to load follow-up settings' })
      );
  }

  saveSettings(): void {
    if (!this.settings) return;
    this.saving = true;
    this.calendarService
      .updateClinicalSessionFollowUpSettings(Number(this.settings.editWindowDays) || 0)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        (settings: ClinicalSessionFollowUpSettings) => (this.settings = settings),
        (error: any) => this.errorService.handleError(error, { prefix: 'Unable to update follow-up settings' })
      );
  }
}
