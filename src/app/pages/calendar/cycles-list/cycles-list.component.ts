import { Component, Input, OnChanges } from '@angular/core';
import { CalendarService } from '../@services/calendar.service';
import { ClinicalSessionKind, TreatmentCycle } from '../@types/calendar';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { finalize } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-cycles-list',
  templateUrl: './cycles-list.component.html',
  styleUrls: ['./cycles-list.component.scss'],
})
export class CyclesListComponent implements OnChanges {
  @Input() patientId?: number;
  @Input() therapistId?: number;
  @Input() cycleKind: ClinicalSessionKind = ClinicalSessionKind.CLINICAL;

  cycles: TreatmentCycle[] = [];
  loading = false;

  constructor(
    private calendarService: CalendarService,
    private errorService: ErrorHandlerService,
    private translate: TranslateService
  ) {}

  ngOnChanges(): void {
    this.loadCycles();
  }

  statusLabel(status?: string): string {
    const labels: Record<string, string> = {
      ACTIVE: this.translate.instant('calendar.cycleActive'),
      FINALIZED: this.translate.instant('calendar.cycleFinalized'),
      FINALIZATION_CANCELLED: this.translate.instant('calendar.finalizationCancelled'),
    };
    return status ? labels[status] || status : '';
  }

  statusColor(status?: string): string {
    const colors: Record<string, string> = {
      ACTIVE: 'green',
      FINALIZED: 'red',
      FINALIZATION_CANCELLED: 'blue',
    };
    return status ? colors[status] || 'default' : 'default';
  }

  reasonLabel(cycle: TreatmentCycle): string {
    if (cycle.status === 'FINALIZED') {
      return cycle.finalizationReasonSnapshot || '-';
    }
    return cycle.newTreatmentReasonSnapshot || '-';
  }

  stringSort(field: keyof TreatmentCycle): (a: TreatmentCycle, b: TreatmentCycle) => number {
    return (a, b) => String(a[field] || '').localeCompare(String(b[field] || ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  numberSort(field: keyof TreatmentCycle): (a: TreatmentCycle, b: TreatmentCycle) => number {
    return (a, b) => Number(a[field] || 0) - Number(b[field] || 0);
  }

  dateSort(field: keyof TreatmentCycle): (a: TreatmentCycle, b: TreatmentCycle) => number {
    return (a, b) => this.timeValue(a[field]) - this.timeValue(b[field]);
  }

  reasonSort = (a: TreatmentCycle, b: TreatmentCycle): number =>
    this.reasonLabel(a).localeCompare(this.reasonLabel(b), undefined, { numeric: true, sensitivity: 'base' });

  private timeValue(value: any): number {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private loadCycles(): void {
    if (!this.patientId && !this.therapistId) return;
    this.loading = true;
    this.calendarService
      .getTreatmentCycles({
        patientId: this.patientId,
        therapistId: this.therapistId,
        cycleKind: this.cycleKind,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (cycles) => (this.cycles = cycles || []),
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('calendar.unableLoadCycles') })
      );
  }
}
