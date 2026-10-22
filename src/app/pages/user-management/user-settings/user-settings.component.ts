import { Component, OnInit } from '@angular/core';
import { timezoneReference, timezoneReferenceOptions } from '@shared/utils/timezone-options.util';
import { AuthService } from '@app/auth/auth.service';
import { User } from '../@types/user';
import { browserTimezone, formatSystemDateTime, userTimezone } from '@shared/utils/system-settings.util';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
})
export class UserSettingsComponent implements OnInit {
  public user: User;
  public loading = true;
  public saving = false;
  public automatic = true;
  public selectedTimezone = timezoneReference(browserTimezone());
  public detectedTimezone = browserTimezone();
  public timezoneOptions = timezoneReferenceOptions();
  private originalManualTimezone?: string;
  private initialSelectedTimezone?: string;

  constructor(
    private auth: AuthService,
    private errors: ErrorHandlerService,
    private message: NzMessageService,
    private translate: TranslateService,
  ) {}

  public ngOnInit(): void {
    this.timezoneOptions = timezoneReferenceOptions(this.translate.currentLang);
    this.auth.getUserProfile().pipe(finalize(() => this.loading = false)).subscribe(
      ({ data }) => {
        this.user = data.getUserProfile;
        this.automatic = !this.user.timezone;
        this.originalManualTimezone = this.user.timezone;
        this.selectedTimezone = timezoneReference(this.user.timezone || this.detectedTimezone);
        this.initialSelectedTimezone = this.selectedTimezone;
        localStorage.setItem('user', JSON.stringify(this.user));
        // Keep the detected zone current for emails, including existing sessions.
        if (this.user.detectedTimezone !== this.detectedTimezone) {
          this.auth.updateMyPreferences({ detectedTimezone: this.detectedTimezone }).subscribe(
            () => undefined, (error) => this.errors.handleError(error),
          );
        }
      },
      (error) => this.errors.handleError(error),
    );
  }

  public currentTimezone(): string {
    return userTimezone();
  }

  public previewTime(): string {
    return formatSystemDateTime(new Date());
  }

  public save(showMessage: boolean = true): void {
    this.saving = true;
    this.auth.updateMyPreferences({
      timezone: this.automatic ? null :
        this.selectedTimezone === this.initialSelectedTimezone && this.originalManualTimezone
          ? this.originalManualTimezone : this.selectedTimezone,
      detectedTimezone: this.detectedTimezone,
    }).pipe(finalize(() => this.saving = false)).subscribe(
      ({ data }) => {
        this.user = { ...this.user, ...data.updateMyPreferences };
        this.originalManualTimezone = this.user.timezone;
        this.initialSelectedTimezone = this.selectedTimezone;
        localStorage.setItem('user', JSON.stringify(this.user));
        if (showMessage) this.message.success(this.translate.instant('userSettings.saved'));
      },
      (error) => this.errors.handleError(error),
    );
  }
}
