import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs/operators';
import { NotificationsService } from '../@services/notifications.service';
import {
  NotificationEvent,
  NotificationEventDescription,
  NotificationEventLabel,
  NotificationPeriodicUnit,
  NotificationPeriodicUnitLabel,
  NotificationPreference,
} from '../@types/notification';

@Component({
  selector: 'app-notification-preferences',
  templateUrl: './notification-preferences.component.html',
  styleUrls: ['./notification-preferences.component.scss'],
})
export class NotificationPreferencesComponent implements OnChanges {
  @Input() patientId?: number;
  @Input() therapistId?: number;
  @Input() userId?: number;
  @Input() accountMode = false;

  loading = false;
  saving = false;
  preference?: NotificationPreference;
  private readonly accountEvents = [
    NotificationEvent.ASSESSMENT_ASSIGNED,
    NotificationEvent.ASSESSMENT_REMINDER,
    NotificationEvent.ASSESSMENT_ANSWERED,
    NotificationEvent.ASSESSMENT_NOT_ANSWERED,
    NotificationEvent.ASSESSMENT_PERIODIC_SUMMARY,
    NotificationEvent.CASE_UPDATED,
    NotificationEvent.USER_CREATED,
    NotificationEvent.FIRST_LOGIN,
    NotificationEvent.LAST_LOGIN,
    NotificationEvent.SESSION_NUMBER,
    NotificationEvent.TREATMENT_FINALIZATION,
    NotificationEvent.SESSION_NO_SHOW_CANCELLATION,
    NotificationEvent.NEW_TREATMENT,
  ];
  private readonly caseEvents = [
    NotificationEvent.ASSESSMENT_REMINDER,
    NotificationEvent.ASSESSMENT_ANSWERED,
    NotificationEvent.ASSESSMENT_NOT_ANSWERED,
    NotificationEvent.ASSESSMENT_PERIODIC_SUMMARY,
    NotificationEvent.CASE_UPDATED,
    NotificationEvent.SESSION_NUMBER,
    NotificationEvent.TREATMENT_FINALIZATION,
    NotificationEvent.SESSION_NO_SHOW_CANCELLATION,
    NotificationEvent.NEW_TREATMENT,
  ];
  units = Object.values(NotificationPeriodicUnit);
  eventLabel = NotificationEventLabel;
  eventDescription = NotificationEventDescription;
  unitLabel = NotificationPeriodicUnitLabel;

  form = this.fb.group({
    enabled: [true],
    immediateEnabled: [true],
    periodicEnabled: [false],
    periodicEvery: [1, [Validators.required, Validators.min(1)]],
    periodicUnit: [NotificationPeriodicUnit.WEEKS],
    enabledEvents: [[], Validators.required],
    excludedRecipientIds: [[]],
  });

  constructor(
    private fb: FormBuilder,
    private notificationsService: NotificationsService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.patientId || changes.therapistId || changes.userId) && (this.patientId || this.therapistId || this.userId)) {
      this.loadPreference();
    }
  }

  get events(): NotificationEvent[] {
    return this.accountMode ? this.accountEvents : this.caseEvents;
  }

  get contextTitle(): string {
    if (this.accountMode) return 'Notificaciones generales';
    return this.therapistId ? 'Notificaciones de la supervisión' : 'Notificaciones del caso';
  }

  get contextDescription(): string {
    if (this.accountMode) return 'Control general de notificaciones para tu cuenta.';
    return this.therapistId
      ? 'Controla las notificaciones vinculadas a este terapeuta y su supervisión.'
      : 'Controla las notificaciones vinculadas a este paciente/caso.';
  }

  loadPreference(): void {
    this.loading = true;
    this.notificationsService
      .getPreference(this.scopeInput())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (preference) => {
          this.preference = preference;
          const enabled = this.accountMode ? preference.enabled : preference.enabled !== false;
          this.form.patchValue({
            enabled,
            immediateEnabled: enabled && preference.immediateEnabled,
            periodicEnabled: enabled && preference.periodicEnabled,
            periodicEvery: preference.periodicEvery || 1,
            periodicUnit: preference.periodicUnit || NotificationPeriodicUnit.WEEKS,
            enabledEvents: this.normalizeEnabledEvents(preference.enabledEvents),
          });
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load notification preferences' })
      );
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.warning('Revisá los campos obligatorios.');
      return;
    }

    const payload = {
      ...this.scopeInput(),
      ...this.form.value,
      periodicEvery: Number(this.form.value.periodicEvery) || 1,
    };
    if (!this.accountMode) {
      Object.assign(payload, {
        enabled: !!(this.form.value.immediateEnabled || this.form.value.periodicEnabled),
        excludedRecipientIds: [],
      });
    }
    if (this.accountMode) {
      Object.assign(payload, {
        immediateEnabled: true,
        periodicEnabled: true,
        excludedRecipientIds: [],
      });
    }
    this.saving = true;
    this.notificationsService
      .updatePreference(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        (preference) => {
          this.preference = preference;
          this.message.success('Preferencias de notificación actualizadas');
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to save notification preferences' })
      );
  }

  accountEventEnabled(event: NotificationEvent): boolean {
    return ((this.form.controls.enabledEvents.value || []) as NotificationEvent[]).includes(event);
  }

  toggleAccountEvent(event: NotificationEvent, enabled: boolean): void {
    const current = ((this.form.controls.enabledEvents.value || []) as NotificationEvent[]).filter((value) => value !== event);
    this.form.controls.enabledEvents.setValue(enabled ? [...current, event] : current);
  }

  private scopeInput(): { patientId?: number; therapistId?: number; userId?: number } {
    if (this.patientId) return { patientId: this.patientId };
    if (this.therapistId) return { therapistId: this.therapistId };
    return { userId: this.userId };
  }

  private normalizeEnabledEvents(enabledEvents?: NotificationEvent[]): NotificationEvent[] {
    if (enabledEvents === undefined || enabledEvents === null) return this.events;
    return enabledEvents.filter((event) => this.events.includes(event));
  }

}
