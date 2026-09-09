import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionKey } from '@shared/@types/permission';
import { SortField, TableColumn } from '@shared/@modules/master-data/@types/list';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { environment } from '@env/environment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { InformedConsentService } from '../@services/informed-consent.service';
import { CalendarService } from '@app/pages/calendar/@services/calendar.service';
import {
  CaseEventReason,
  CaseEventReasonContext,
} from '@app/pages/calendar/@types/calendar';
import {
  InformedConsentAnswerResolution,
  InformedConsentKindLabel,
  InformedConsentResponse,
  InformedConsentResponseStatus,
} from '../@types/informed-consent';

const CryptoJS = require('crypto-js');

type ConsentBlockType = 'TEXT' | 'QUESTION';

@Component({
  selector: 'app-informed-consent-responses-list',
  templateUrl: './responses-list.component.html',
  styleUrls: ['./responses-list.component.scss'],
})
export class InformedConsentResponsesListComponent implements OnInit, OnChanges {
  @Input() patientId?: number;
  @Input() userId?: number;
  @Input() ownOnlyInput = false;
  @Input() latestOnly = false;
  @Input() userView = false;
  loading = false;
  searchString = '';
  responses: InformedConsentResponse[] = [];
  filteredResponses: any[] = [];
  selectedResponse?: InformedConsentResponse;
  selectedHistory: InformedConsentResponse[] = [];
  responseVisible = false;
  reactivateVisible = false;
  reactivateReasonLevels: CaseEventReason[][] = [];
  selectedReactivateReasonIds: number[] = [];
  reactivateReasonId?: number;
  reactivateComment = '';
  reactivateOtherReason = '';
  reactivating = false;
  ownOnly = false;
  kindLabel = InformedConsentKindLabel;
  sortFields: SortField<any>[] = [];
  columns: TableColumn<any>[] = [
    { title: 'informedConsent.model', translationPath: 'informedConsent.model', name: 'modelName', sort: true, filterField: { type: 'text', value: undefined } as any },
    { title: 'informedConsent.management', translationPath: 'informedConsent.management', name: 'managementTitle', sort: true },
    { title: 'informedConsent.signer', translationPath: 'informedConsent.signer', name: 'signerName', sort: true },
    { title: 'informedConsent.represented', translationPath: 'informedConsent.represented', name: 'representedName', sort: true },
    { title: 'core.status', translationPath: 'core.status', name: 'formattedStatus', render: 'tag', sort: true },
    { title: 'informedConsent.resolution', translationPath: 'informedConsent.resolution', name: 'formattedResolution', sort: true },
    { title: 'core.date', translationPath: 'core.date', name: 'answeredDate', render: 'date', sort: true },
    { title: 'informedConsent.records', translationPath: 'informedConsent.records', name: 'historyCount', sort: true },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: InformedConsentService,
    private calendarService: CalendarService,
    private modal: NzModalService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    private perms: AppPermissionsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.ownOnly = this.ownOnlyInput || !!this.route.snapshot.data?.ownOnly;
    this.load();
  }

  ngOnChanges(): void {
    if (this.responses.length) this.applyLocalFilters();
  }

  load(): void {
    if (!this.ownOnly && !this.canViewGlobalResponses()) {
      this.responses = [];
      this.filteredResponses = [];
      return;
    }
    this.loading = true;
    const request = this.ownOnly ? this.service.getMyResponses() : this.service.getResponses();
    request.pipe(finalize(() => (this.loading = false))).subscribe(
      (responses) => {
        this.responses = responses || [];
        this.applyLocalFilters();
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableLoadResponses') })
    );
  }

  open(response: InformedConsentResponse): void {
    this.selectedResponse = response;
    this.selectedHistory = this.latestOnly ? [response] : this.historyForResponse(response);
    this.responseVisible = true;
  }

  selectHistoryResponse(response: InformedConsentResponse): void {
    this.selectedResponse = response;
  }

  requestChange(response: InformedConsentResponse): void {
    if (!response?.id) {
      this.message.error(this.translate.instant('informedConsent.unableIdentifyResponse'));
      return;
    }
    this.modal.confirm({
      nzTitle: this.translate.instant('informedConsent.modifyConsent'),
      nzContent: this.translate.instant('informedConsent.modifyConsentWarning'),
      nzOkText: this.translate.instant('core.continue'),
      nzCancelText: this.translate.instant('core.cancel'),
      nzOnOk: () => {
        this.responseVisible = false;
        const input = {
          responseId: Number(response.id),
            reason: this.translate.instant('informedConsent.userRequestedResponseChange'),
        };
        const request = this.ownOnly
          ? this.service.reactivateMyResponse(input)
          : this.service.reactivateResponse(input);
        request.subscribe(
          () => {
            this.message.success(this.translate.instant('informedConsent.consentReactivated'));
            const publicToken = this.ownOnly ? this.publicConsentToken(response.signerUserId) : undefined;
            if (publicToken) {
              const tree = this.router.createUrlTree(['/informed-consent/pending'], {
                queryParams: {
                  managementId: response.managementId,
                  editingResponseId: response.id,
                  previousStatus: response.status,
                  token: publicToken,
                },
              });
              window.open(this.router.serializeUrl(tree), '_blank');
              return;
            }
            this.router.navigate([publicToken ? '/informed-consent/pending' : '/psira/informed-consent/pending'], {
              queryParams: {
                managementId: response.managementId,
                editingResponseId: response.id,
                previousStatus: response.status,
                ...(publicToken ? { token: publicToken } : {}),
              },
            });
          },
          (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableReactivateResponse') })
        );
      },
    });
  }

  openReactivate(response: InformedConsentResponse): void {
    this.selectedResponse = response;
    this.reactivateReasonLevels = [];
    this.selectedReactivateReasonIds = [];
    this.reactivateReasonId = undefined;
    this.reactivateComment = '';
    this.reactivateOtherReason = '';
    this.reactivateVisible = true;
    this.loadReactivateReasonLevel(undefined, 0);
  }

  submitReactivate(): void {
    if (!this.selectedResponse?.id) return;
    if (!this.reactivateReasonId) {
      this.message.warning(this.translate.instant('informedConsent.enterReactivationReason'));
      return;
    }
    if (this.selectedReactivateReason()?.isOther && !this.reactivateOtherReason.trim()) {
      this.message.warning(this.translate.instant('calendar.completeOtherReason'));
      return;
    }
    this.reactivating = true;
    this.service
      .reactivateResponse({
        responseId: Number(this.selectedResponse.id),
        reason: this.selectedReactivateReasonPath(),
        comment: this.reactivateComment?.trim() || undefined,
      })
      .pipe(finalize(() => (this.reactivating = false)))
      .subscribe(
        () => {
          this.message.success(this.translate.instant('informedConsent.consentReactivated'));
          this.reactivateVisible = false;
          this.responseVisible = false;
          this.load();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableReactivateResponse') })
      );
  }

  canReactivate(response?: InformedConsentResponse): boolean {
    return !!response
      && !this.ownOnly
      && this.isLatestResponseInstance(response)
      && [InformedConsentResponseStatus.BLOCKED, InformedConsentResponseStatus.REVOKED].includes(response.status);
  }

  onReactivateReasonChange(levelIndex: number, reasonId?: number): void {
    this.selectedReactivateReasonIds = this.selectedReactivateReasonIds.slice(0, levelIndex);
    this.reactivateReasonLevels = this.reactivateReasonLevels.slice(0, levelIndex + 1);
    if (!reasonId) {
      this.reactivateReasonId = undefined;
      this.reactivateOtherReason = '';
      return;
    }
    this.selectedReactivateReasonIds[levelIndex] = Number(reasonId);
    this.reactivateReasonId = Number(reasonId);
    if (!this.selectedReactivateReason()?.isOther) {
      this.reactivateOtherReason = '';
    }
    this.loadReactivateReasonLevel(Number(reasonId), levelIndex + 1);
  }

  reactivateReasonLevelLabel(levelIndex: number): string {
    if (levelIndex === 0) return this.translate.instant('calendar.reason');
    const previousReasonId = this.selectedReactivateReasonIds[levelIndex - 1];
    const previousReason = this.reactivateReasonLevels[levelIndex - 1]?.find(
      (reason) => Number(reason.id) === Number(previousReasonId)
    );
    return previousReason?.nextLevelLabel || this.translate.instant('calendar.subreason');
  }

  userName(user: any): string {
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || user?.username || '';
  }

  statusColor(status: InformedConsentResponseStatus): string {
    if (status === InformedConsentResponseStatus.SUBMITTED) return 'green';
    if (status === InformedConsentResponseStatus.BLOCKED) return 'red';
    if (status === InformedConsentResponseStatus.REACTIVATED) return 'blue';
    if (status === InformedConsentResponseStatus.REVOKED) return 'orange';
    return 'default';
  }

  versionBlocks(response?: InformedConsentResponse): any[] {
    const textBlocks = (response?.version?.textBlocks || []).map((block) => ({
      ...block,
      blockType: 'TEXT' as ConsentBlockType,
    }));
    const questions = (response?.version?.questions || []).map((question) => ({
      ...question,
      blockType: 'QUESTION' as ConsentBlockType,
    }));
    return [...textBlocks, ...questions].sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));
  }

  selectedAnswerOptionId(response: InformedConsentResponse, questionId: number): number {
    return response.answers?.find((answer) => Number(answer.questionId) === Number(questionId))?.answerOptionId;
  }

  isSelectedAnswer(response: InformedConsentResponse, questionId: number, optionId: number): boolean {
    return Number(this.selectedAnswerOptionId(response, questionId)) === Number(optionId);
  }

  consentKindNames(kinds?: any[], kind?: any): string {
    const values = kinds?.length ? kinds : (kind ? [kind] : []);
    return values.length
      ? values.map((value) => this.translate.instant(this.kindLabel[value] || value)).join(', ')
      : this.translate.instant('informedConsent.noKindAssociated');
  }

  showTechnicalMetadata(): boolean {
    return !this.userView;
  }

  resolutionLabel(resolution?: InformedConsentAnswerResolution): string {
    const labels: Record<string, string> = {
      [InformedConsentAnswerResolution.ACCEPTS]: this.translate.instant('informedConsent.resolutionAccepts'),
      [InformedConsentAnswerResolution.REJECTS]: this.translate.instant('informedConsent.resolutionRejects'),
      [InformedConsentAnswerResolution.REQUIRES_REVIEW]: this.translate.instant('informedConsent.resolutionRequiresReview'),
      [InformedConsentAnswerResolution.NOT_APPLICABLE]: this.translate.instant('informedConsent.resolutionNotApplicable'),
    };
    return resolution ? labels[resolution] || resolution : '-';
  }

  onSearch(searchString: string): void {
    this.searchString = searchString || '';
    this.applyLocalFilters();
  }

  resetFilters(): void {
    this.searchString = '';
    this.applyLocalFilters();
  }

  onSort(sortFields: SortField<any>[]): void {
    this.sortFields = sortFields || [];
    this.applyLocalFilters();
  }

  private applyLocalFilters(): void {
    const term = this.searchString.trim().toLowerCase();
    const scopedResponses = this.responses
      .filter((response) => {
        if (
          this.patientId &&
          Number(response.patientId) !== Number(this.patientId) &&
          Number(response.signerUserId) !== Number(this.userId) &&
          Number(response.representedUserId) !== Number(this.userId)
        ) {
          return false;
        }
        if (
          this.userId &&
          !this.patientId &&
          Number(response.signerUserId) !== Number(this.userId) &&
          Number(response.representedUserId) !== Number(this.userId)
        ) {
          return false;
        }
        return true;
      });
    const rows = this.visibleResponses(scopedResponses)
      .map((response) => ({
        ...response,
        source: response,
        modelName: response.model?.name || '',
        managementTitle: response.management?.title || '',
        signerName: this.userName(response.signer),
        representedName: this.userName(response.representedUser) || '-',
        formattedStatus: {
          color: this.statusColor(response.status),
          title: response.status,
        },
        formattedResolution: response.finalResolution || '-',
        answeredDate: response.answeredAt || response.createdAt,
        historyCount: this.latestOnly ? 1 : this.historyForResponse(response, scopedResponses).length,
      }))
      .filter((response) => {
        if (!term) return true;
        return [
          response.modelName,
          response.managementTitle,
          response.signerName,
          response.representedName,
          response.status,
          response.finalResolution,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      });

    this.filteredResponses = this.sortRows(rows);
  }

  private sortRows(rows: any[]): any[] {
    const activeSort = this.sortFields.find((sort) => !!sort.direction);
    if (!activeSort) return rows;
    const direction = activeSort.direction === 'ASC' ? 1 : -1;
    return [...rows].sort((a, b) => this.compareValues(a[activeSort.field], b[activeSort.field]) * direction);
  }

  private compareValues(a: any, b: any): number {
    const left = a?.title || a || '';
    const right = b?.title || b || '';
    const leftDate = Date.parse(left);
    const rightDate = Date.parse(right);
    if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) return leftDate - rightDate;
    return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
  }

  private canViewGlobalResponses(): boolean {
    return this.perms.permissionsOnly([
      PermissionKey.INFORMED_CONSENT_RESPONSES_VIEW_DEPARTMENT,
      PermissionKey.INFORMED_CONSENT_RESPONSES_REVIEW_DEPARTMENT,
    ]);
  }

  private visibleResponses(responses: InformedConsentResponse[]): InformedConsentResponse[] {
    const latestByManagement = new Map<string, InformedConsentResponse>();
    for (const response of responses) {
      const key = this.responseGroupKey(response);
      const current = latestByManagement.get(key);
      if (!current || this.responsePriority(response) > this.responsePriority(current)) {
        latestByManagement.set(key, response);
      }
    }
    return Array.from(latestByManagement.values());
  }

  private responsePriority(response: InformedConsentResponse): number {
    const statusBonus = response.status === InformedConsentResponseStatus.REACTIVATED ? -1000000000000 : 0;
    return this.responseTime(response) * 10 + statusBonus;
  }

  private responseTime(response: InformedConsentResponse): number {
    return Date.parse(String(response.answeredAt || response.createdAt || '')) || 0;
  }

  private historyForResponse(
    response: InformedConsentResponse,
    responses: InformedConsentResponse[] = this.responses
  ): InformedConsentResponse[] {
    const key = this.responseGroupKey(response);
    return responses
      .filter((candidate) => this.responseGroupKey(candidate) === key)
      .sort((a, b) => this.responseTime(b) - this.responseTime(a));
  }

  private responseGroupKey(response: InformedConsentResponse): string {
    const sourceId = this.latestOnly
      ? (response.modelId || response.model?.id)
      : (response.managementId || response.modelId || response.model?.id);
    return [
      sourceId || '',
      response.signerUserId || '',
      response.representedUserId || '',
    ].join(':');
  }

  private isLatestResponseInstance(response: InformedConsentResponse): boolean {
    const history = this.historyForResponse(response);
    return !!history.length && Number(history[0].id) === Number(response.id);
  }

  private loadReactivateReasonLevel(parentId: number | undefined, levelIndex: number): void {
    const context = this.reactivateReasonContext(this.selectedResponse);
    this.calendarService.getCaseEventReasons(context, parentId).subscribe(
      (reasons) => {
        this.reactivateReasonLevels = this.reactivateReasonLevels.slice(0, levelIndex);
        if (reasons?.length) {
          this.reactivateReasonLevels[levelIndex] = reasons;
        }
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableLoadReactivationReasons') })
    );
  }

  private reactivateReasonContext(response?: InformedConsentResponse): CaseEventReasonContext {
    return CaseEventReasonContext.INFORMED_CONSENT_REACTIVATION;
  }

  private selectedReactivateReasonPath(): string {
    const path = this.selectedReactivateReasonIds
      .map((id, index) => this.reactivateReasonLevels[index]?.find((reason) => Number(reason.id) === Number(id))?.label)
      .filter(Boolean)
      .join(' > ');
    if (this.selectedReactivateReason()?.isOther && this.reactivateOtherReason.trim()) {
      return `${path}: ${this.reactivateOtherReason.trim()}`;
    }
    return path;
  }

  selectedReactivateReason(): CaseEventReason | undefined {
    if (!this.reactivateReasonId) return undefined;
    for (const level of this.reactivateReasonLevels) {
      const reason = level.find((item) => Number(item.id) === Number(this.reactivateReasonId));
      if (reason) return reason;
    }
    return undefined;
  }

  private publicConsentToken(userId: number): string {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);
    return CryptoJS.AES.encrypt(
      JSON.stringify({ userId, exp: expiresAt.getTime() }),
      environment.secretKey
    ).toString();
  }
}
