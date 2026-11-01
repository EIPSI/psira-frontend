import { AfterViewInit, Component, ElementRef, NgZone, OnChanges, OnDestroy } from '@angular/core';
import { rangeLabelLayout } from './range-layout';
import { QuestionBaseComponent, ScaleLabel } from '../../../@types/question';

@Component({
  selector: 'app-range-question',
  templateUrl: './range-question.component.html',
  styleUrls: ['./range-question.component.scss'],
})
export class RangeQuestionComponent extends QuestionBaseComponent implements AfterViewInit, OnChanges, OnDestroy {
  preview?: number;
  private observer?: { observe(target: Element): void; disconnect(): void };
  private frame?: number;
  private measuredWidth = 0;
  private destroyed = false;
  private answerKey?: string;
  private viewReady = false;
  private lastCommit?: { value: number; at: number };
  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {
    super();
  }

  ngOnChanges(): void {
    const key = `${this.question?._id || this.question?.name}:${this.answer?.occurrenceId || 'single'}`;
    if (key !== this.answerKey) {
      this.preview = undefined;
      this.lastCommit = undefined;
      this.answerKey = key;
    }
    if (this.viewReady) this.measureLabels();
  }
  ngAfterViewInit(): void {
    this.viewReady = true;
    const Observer = (window as any).ResizeObserver;
    this.zone.runOutsideAngular(() => {
      if (Observer) {
        this.observer = new Observer(() => {
          const width = this.host.nativeElement.getBoundingClientRect().width;
          if (Math.abs(width - this.measuredWidth) > 0.5) this.measureLabels();
        });
        this.observer.observe(this.host.nativeElement);
      }
      // Font substitution can change endpoint widths without resizing the host.
      const fonts = (document as any).fonts;
      if (fonts?.ready) fonts.ready.then(() => { if (!this.destroyed) this.measureLabels(); });
      this.measureLabels();
    });
  }
  ngOnDestroy(): void {
    this.destroyed = true;
    this.observer?.disconnect();
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
  }
  get config() {
    return this.question.presentation;
  }
  get value(): number {
    return this.preview ?? this.answer.numberValue ?? (this.config.min + this.config.max) / 2;
  }
  get answered(): boolean {
    return this.preview !== undefined || this.answer.numberValue != null;
  }
  get background(): string {
    if (this.config.gradient === 'none') return 'linear-gradient(to right, #d5dfec, #d5dfec)';
    const start = this.config.gradient === 'descending' ? '#008080' : this.config.colorStart;
    const end = this.config.gradient === 'descending' ? '#800000' : this.config.colorEnd;
    return `linear-gradient(to right, ${start}, ${end})`;
  }
  labels(position: string): ScaleLabel[] {
    return this.config.labels.filter((label) => label.position === position);
  }
  position(label: ScaleLabel): number {
    return (100 * (label.value - this.config.min)) / (this.config.max - this.config.min);
  }
  alignment(label: ScaleLabel): string {
    return label.align === 'auto' ? 'center' : label.align;
  }
  input(value: string): void {
    this.preview = Number(value);
  }
  commit(value: string): void {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    const now = Date.now();
    if (this.lastCommit?.value === number && now - this.lastCommit.at < 100) return;
    this.lastCommit = { value: number, at: now };
    this.preview = number;
    this.answer.numberValue = number;
    this.answerChange.emit(this.answer);
  }
  private measureLabels(): void {
    if (this.destroyed) return;
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.zone.runOutsideAngular(() => {
      this.frame = requestAnimationFrame(() => {
        this.frame = undefined;
        if (this.destroyed) return;
        const host = this.host.nativeElement;
        const container = host.querySelector<HTMLElement>('.range-question');
        const axis = host.querySelector<HTMLElement>('.range-axis');
        if (!container || !axis) return;
        const width = container.clientWidth;
        if (!width) return;
        this.measuredWidth = host.getBoundingClientRect().width;
        const rows = Array.from(host.querySelectorAll<HTMLElement>('.scale-labels'));
        const elements = rows.reduce((all, row) => all.concat(Array.from(row.querySelectorAll<HTMLElement>('span'))),
          [] as HTMLElement[]);
        elements.forEach(label => {
          label.style.width = 'max-content';
          label.style.maxWidth = 'none';
          label.style.whiteSpace = 'nowrap';
        });
        const measured = elements.map(label => ({
          position: parseFloat(label.style.left) / 100,
          row: label.parentElement.classList.contains('above') ? 'above' : 'below',
          width: label.getBoundingClientRect().width,
        }));
        elements.forEach(label => {
          label.style.width = 'min-content';
          label.style.whiteSpace = 'normal';
          label.style.overflowWrap = 'normal';
        });
        const minimumWidths = elements.map(label => label.getBoundingClientRect().width);
        const layout = rangeLabelLayout(width, measured.map((label, index) => ({ ...label, minWidth: minimumWidths[index] })));
        axis.style.marginLeft = `${layout.left}px`;
        axis.style.marginRight = `${layout.right}px`;
        elements.forEach((label, index) => {
          label.style.width = `${layout.widths[index]}px`;
          label.style.whiteSpace = 'normal';
          label.style.overflowWrap = layout.widths[index] + 1 < minimumWidths[index] ? 'anywhere' : 'normal';
        });
        rows.forEach(row => this.layoutRow(row));
      });
    });
  }

  private layoutRow(row: HTMLElement): void {
    const labels = Array.from(row.querySelectorAll<HTMLElement>('span'));
    const measured = labels.map(label => ({ label, rect: label.getBoundingClientRect() }))
      .sort((a, b) => a.rect.left - b.rect.left);
    const lanes: Array<{ end: number; height: number }> = [];
    const assignments = measured.map(item => {
      let lane = lanes.findIndex(candidate => candidate.end + 6 <= item.rect.left);
      if (lane < 0) { lane = lanes.length; lanes.push({ end: 0, height: 0 }); }
      lanes[lane].end = item.rect.right;
      lanes[lane].height = Math.max(lanes[lane].height, item.rect.height);
      return { label: item.label, lane };
    });
    const above = row.classList.contains('above');
    assignments.forEach(({ label, lane }) => {
      const offset = lanes.slice(0, lane).reduce((total, item) => total + item.height + 6, 0);
      label.style.bottom = above ? `${offset}px` : 'auto';
      label.style.top = above ? 'auto' : `${offset}px`;
    });
    row.style.height = `${lanes.reduce((total, lane) => total + lane.height + 6, 0)}px`;
  }
}
