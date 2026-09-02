import { Component, Input, OnChanges } from '@angular/core';
import { EvaluationAutomationsService } from '@app/pages/evaluation-automations/@services/evaluation-automations.service';
import { EvaluationAutomationTriggerPointLabel } from '@app/pages/evaluation-automations/@types/evaluation-automation';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { finalize } from 'rxjs/operators';

interface AppliedAutomationRun {
  id: number;
  automationTitle?: string;
  triggerPoint?: string;
  status?: string;
  reason?: string;
  message?: string;
  resourceType?: string;
  resourceId?: number;
  createdAt?: string;
}

@Component({
  selector: 'app-applied-automations-list',
  templateUrl: './applied-automations-list.component.html',
  styleUrls: ['./applied-automations-list.component.scss'],
})
export class AppliedAutomationsListComponent implements OnChanges {
  @Input() userId?: number;

  runs: AppliedAutomationRun[] = [];
  loading = false;
  triggerPointLabel: any = EvaluationAutomationTriggerPointLabel;

  constructor(
    private automationsService: EvaluationAutomationsService,
    private errorService: ErrorHandlerService
  ) {}

  ngOnChanges(): void {
    this.loadRuns();
  }

  statusColor(status?: string): string {
    const colors: Record<string, string> = {
      EXECUTED: 'green',
      SKIPPED: 'gold',
      FAILED: 'red',
      PENDING: 'blue',
    };
    return status ? colors[status] || 'default' : 'default';
  }

  stringSort(field: keyof AppliedAutomationRun): (a: AppliedAutomationRun, b: AppliedAutomationRun) => number {
    return (a, b) => String(a[field] || '').localeCompare(String(b[field] || ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  dateSort(field: keyof AppliedAutomationRun): (a: AppliedAutomationRun, b: AppliedAutomationRun) => number {
    return (a, b) => this.timeValue(a[field]) - this.timeValue(b[field]);
  }

  private timeValue(value: any): number {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private loadRuns(): void {
    if (!this.userId) {
      this.runs = [];
      return;
    }

    this.loading = true;
    this.automationsService
      .getAutomationRuns({
        paging: { first: 50 },
        filter: { userId: { eq: this.userId } },
        sorting: [{ field: 'createdAt', direction: 'DESC' }],
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ edges }) => (this.runs = (edges || []).map((edge: any) => edge.node)),
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load applied automations' })
      );
  }
}
