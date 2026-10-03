import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  AddClinicalSessionSchemesApplicationMode,
  CalendarEvent,
  ClinicalSessionModality,
  ClinicalSessionSchemeApplication,
} from '../@types/calendar';
import { RepeatEndMode, RepeatOption, RepeatUnit } from '../@services/calendar-recurrence.service';

export interface ResponsibleUserOption {
  id: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  workID?: string;
}

@Component({
  selector: 'app-event-edit-modal',
  templateUrl: './event-edit-modal.component.html',
  styleUrls: ['./event-edit-modal.component.scss'],
})
export class EventEditModalComponent {
  RE = RepeatEndMode;
  RU = RepeatUnit;

  @Input() visible = false;
  @Input() saving = false;
  @Input() event?: CalendarEvent;
  @Input() startAt?: Date;
  @Input() endAt?: Date;
  @Input() sessionNumber?: number;
  @Input() modality?: ClinicalSessionModality;
  @Input() description = '';
  @Input() responsibleUserIds: number[] = [];
  @Input() responsibleUserOptions: ResponsibleUserOption[] = [];
  @Input() responsibleUsersChanged = false;
  @Input() responsibleUsersPropagate = false;
  @Input() modalityOptions: Array<{ label: string; value: ClinicalSessionModality }> = [];
  @Input() restructureEnabled = false;
  @Input() restructureEvery = 1;
  @Input() restructureUnit = RepeatUnit.WEEK;
  @Input() restructureOnDays: number[] = [];
  @Input() restructureEndMode = RepeatEndMode.AFTER_COUNT;
  @Input() restructureEndDate?: Date;
  @Input() restructureCount = 12;
  @Input() repeatUnits: RepeatOption<RepeatUnit>[] = [];
  @Input() weekDayOptions: RepeatOption<number>[] = [];
  @Input() schemeOptions: Array<{ id: number; name: string }> = [];
  @Input() addSchemeIds: number[] = [];
  @Input() addSchemesPropagate = false;
  @Input() addSchemesApplicationMode = AddClinicalSessionSchemesApplicationMode.RELATIVE_FROM_SESSION;
  @Input() addSchemeApplicationModeOptions: Array<{ label: string; value: AddClinicalSessionSchemesApplicationMode }> = [];
  @Input() activeSchemeApplications: ClinicalSessionSchemeApplication[] = [];
  @Input() overwriteExistingSchemes = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() startAtChange = new EventEmitter<Date>();
  @Output() endAtChange = new EventEmitter<Date>();
  @Output() sessionNumberChange = new EventEmitter<number | undefined>();
  @Output() modalityChange = new EventEmitter<ClinicalSessionModality>();
  @Output() descriptionChange = new EventEmitter<string>();
  @Output() responsibleUserIdsChange = new EventEmitter<number[]>();
  @Output() responsibleUsersPropagateChange = new EventEmitter<boolean>();
  @Output() restructureEnabledChange = new EventEmitter<boolean>();
  @Output() restructureEveryChange = new EventEmitter<number>();
  @Output() restructureUnitChange = new EventEmitter<RepeatUnit>();
  @Output() restructureOnDaysChange = new EventEmitter<number[]>();
  @Output() restructureEndModeChange = new EventEmitter<RepeatEndMode>();
  @Output() restructureEndDateChange = new EventEmitter<Date | undefined>();
  @Output() restructureCountChange = new EventEmitter<number>();
  @Output() addSchemeIdsChange = new EventEmitter<number[]>();
  @Output() addSchemesPropagateChange = new EventEmitter<boolean>();
  @Output() addSchemesApplicationModeChange = new EventEmitter<AddClinicalSessionSchemesApplicationMode>();
  @Output() overwriteExistingSchemesChange = new EventEmitter<boolean>();
  @Output() stopScheme = new EventEmitter<ClinicalSessionSchemeApplication>();
  @Output() save = new EventEmitter<void>();
  @Output() discard = new EventEmitter<CalendarEvent>();
  @Output() durationChange = new EventEmitter<number>();

  get canEdit(): boolean {
    return !!this.event?.editable;
  }

  responsibleUserLabelKey(): string {
    return this.event?.sessionKind === 'SUPERVISION' ? 'calendar.supervisors' : 'core.caseManagers';
  }

  userLabel(user: ResponsibleUserOption): string {
    const name = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
    return [user.workID, name || user.username || user.email || user.id].filter(Boolean).join(' - ');
  }

  close(): void {
    this.visibleChange.emit(false);
  }

  discardEvent(): void {
    if (!this.event) return;
    this.discard.emit(this.event);
  }
}
