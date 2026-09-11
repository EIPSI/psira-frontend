import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { InformedConsentService } from '../@services/informed-consent.service';
import {
  InformedConsentAnswerOption,
  InformedConsentKindLabel,
  InformedConsentModel,
  InformedConsentResponseStatus,
  PendingInformedConsent,
} from '../@types/informed-consent';

@Component({
  selector: 'app-pending-informed-consents',
  templateUrl: './pending-consents.component.html',
  styleUrls: ['./pending-consents.component.scss'],
})
export class PendingInformedConsentsComponent implements OnInit, OnDestroy {
  loading = false;
  savingId?: number;
  pending: PendingInformedConsent[] = [];
  visiblePendingItems: PendingInformedConsent[] = [];
  selectedManagementId?: number;
  editingResponseId?: number;
  previousStatus?: InformedConsentResponseStatus;
  publicToken?: string;
  private editCompleted = false;
  private cancelRequested = false;
  models: Record<number, InformedConsentModel> = {};
  modelBlocks: Record<number, any[]> = {};
  modelLoading: Record<number, boolean> = {};
  modelLoadError: Record<number, boolean> = {};
  answers: Record<number, Record<number, number>> = {};
  kindLabel = InformedConsentKindLabel;
  submittedThankYouHtml?: string;

  constructor(
    private service: InformedConsentService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const managementId = Number(this.route.snapshot.queryParamMap.get('managementId'));
    const editingResponseId = Number(this.route.snapshot.queryParamMap.get('editingResponseId'));
    this.selectedManagementId = Number.isFinite(managementId) && managementId > 0 ? managementId : undefined;
    this.editingResponseId = Number.isFinite(editingResponseId) && editingResponseId > 0 ? editingResponseId : undefined;
    this.previousStatus = this.route.snapshot.queryParamMap.get('previousStatus') as InformedConsentResponseStatus;
    this.publicToken = this.route.snapshot.queryParamMap.get('token') || undefined;
    this.load();
  }

  ngOnDestroy(): void {
    this.cancelOpenEditIfNeeded();
  }

  load(): void {
    this.loading = true;
    const request = this.publicToken ? this.service.getPublicPending(this.publicToken) : this.service.getPending();
    request.pipe(finalize(() => (this.loading = false))).subscribe(
      (pending) => {
        this.pending = pending || [];
        this.syncVisiblePendingItems();
        this.visiblePendingItems.forEach((item) => this.loadModel(item.modelId));
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableLoadPending') })
    );
  }

  loadModel(modelId: number): void {
    if (this.models[modelId] || this.modelLoading[modelId]) return;
    this.modelLoading[modelId] = true;
    this.modelLoadError[modelId] = false;
    const request = this.publicToken
      ? this.service.getPublicPendingModel(this.publicToken, modelId)
      : this.service.getPendingModel(modelId);
    request.subscribe(
      (model) => {
        this.models[modelId] = model;
        this.modelBlocks[modelId] = this.buildVersionBlocks(model);
        this.modelLoading[modelId] = false;
      },
      (error) => {
        this.modelLoading[modelId] = false;
        this.modelLoadError[modelId] = true;
        this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableLoadModel') });
      }
    );
  }

  submit(item: PendingInformedConsent): void {
    const model = this.models[item.modelId];
    const questions = model?.currentPublishedVersion?.questions || [];
    const missing = questions.some((question) => question.required && !this.answers[item.managementId]?.[question.id]);
    if (missing) {
      this.message.warning(this.translate.instant('informedConsent.answerRequiredQuestions'));
      return;
    }
    const answers = questions.map((question) => ({
      questionId: question.id,
      answerOptionId: this.answers[item.managementId]?.[question.id],
    }));
    this.savingId = item.managementId;
    const request = this.publicToken
      ? this.service.submitPublicResponse(this.publicToken, { managementId: item.managementId, answers })
      : this.service.submitResponse({ managementId: item.managementId, answers });
    request.pipe(finalize(() => (this.savingId = undefined))).subscribe(
      () => {
        this.editCompleted = true;
        this.submittedThankYouHtml = model.currentPublishedVersion?.thankYouHtml || `<p>${this.translate.instant('informedConsent.defaultThankYou')}</p>`;
        this.message.success(this.translate.instant('informedConsent.consentRegistered'));
        if (!this.publicToken) {
          this.router.navigate(['/psira/dashboard']);
          return;
        }
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableSubmitConsent') })
    );
  }

  select(item: PendingInformedConsent, questionId: number, option: InformedConsentAnswerOption): void {
    this.answers[item.managementId] = this.answers[item.managementId] || {};
    this.answers[item.managementId][questionId] = option.id;
  }

  selectedAnswer(item: PendingInformedConsent, questionId: number): number {
    return this.answers[item.managementId] ? this.answers[item.managementId][questionId] : undefined;
  }

  setAnswer(item: PendingInformedConsent, questionId: number, optionId: number): void {
    this.answers[item.managementId] = this.answers[item.managementId] || {};
    this.answers[item.managementId][questionId] = optionId;
  }

  model(item: PendingInformedConsent): InformedConsentModel {
    return this.models[item.modelId];
  }

  private buildVersionBlocks(modelData: InformedConsentModel): any[] {
    const version = modelData?.currentPublishedVersion;
    const textBlocks = (version?.textBlocks || []).map((block) => ({ ...block, blockType: 'TEXT' }));
    const questions = (version?.questions || []).map((question) => ({ ...question, blockType: 'QUESTION' }));
    return [...textBlocks, ...questions].sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0));
  }

  submitButtonLabel(modelData: InformedConsentModel): string {
    return modelData?.currentPublishedVersion?.submitButtonLabel || this.translate.instant('informedConsent.defaultSubmitButton');
  }

  private syncVisiblePendingItems(): void {
    this.visiblePendingItems = this.selectedManagementId
      ? this.pending.filter((item) => Number(item.managementId) === Number(this.selectedManagementId))
      : this.pending;
  }

  private loadAfterSubmit(): void {
    this.loading = true;
    const request = this.publicToken ? this.service.getPublicPending(this.publicToken) : this.service.getPending();
    request.pipe(finalize(() => (this.loading = false))).subscribe(
      (pending) => {
        this.pending = pending || [];
        this.syncVisiblePendingItems();
        this.visiblePendingItems.forEach((pendingItem) => this.loadModel(pendingItem.modelId));
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableLoadPending') })
    );
  }

  goHome(): void {
    this.router.navigate([this.publicToken ? '/auth/login' : '/psira/dashboard']);
  }

  private cancelOpenEditIfNeeded(): void {
    if (!this.editingResponseId || this.editCompleted || this.cancelRequested) return;
    this.cancelRequested = true;
    const input = {
      responseId: this.editingResponseId,
      previousStatus: this.previousStatus || InformedConsentResponseStatus.SUBMITTED,
    };
    const request = this.publicToken
      ? this.service.cancelPublicReactivation(this.publicToken, input)
      : this.service.cancelMyReactivation(input);
    request.subscribe(
      () => undefined,
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('informedConsent.unableCancelConsentEdition') })
    );
  }
}
