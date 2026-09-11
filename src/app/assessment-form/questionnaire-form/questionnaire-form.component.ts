import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AssessmentStatus, FullAssessment } from '@app/pages/assessment/@types/assessment';
import { QuestionnaireVersion } from '../../pages/questionnaire-management/@types/questionnaire';
import { combineLatest, forkJoin } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Answer } from '../@types/answer';
import { Question } from '../@types/question';
import { AssessmentFormService } from '../assessment-form.service';
import { AssessmentService } from '../../pages/assessment/@services/assessment.service';
import { ErrorHandlerService } from '../../@shared/services/error-handler.service';
import { PsiraTranslations } from '../../@core/psira-translations';
import { SkipLogic } from '../skip-logic';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TranslateService } from '@ngx-translate/core';

interface AssessmentScreen {
  id: string;
  label: string;
  sourceBundleId?: string;
  headerHtml?: string;
  footerHtml?: string;
  bundleHeaderHtml?: string;
  bundleNoticeHtml?: string;
  questionnaires: any[];
}

@UntilDestroy()
@Component({
  selector: 'app-questionnaire-form',
  templateUrl: './questionnaire-form.component.html',
  styleUrls: ['./questionnaire-form.component.scss'],
})
export class QuestionnaireFormComponent {
  public assessment: FullAssessment;
  public screens: AssessmentScreen[] = [];
  public currentScreenIdx = 0;
  public currentScreen: AssessmentScreen;
  public answers: Answer[] = [];
  public mapped: any = {};
  public completed = false;
  public AssessmentStatus = AssessmentStatus;

  constructor(
    private activatedRoute: ActivatedRoute,
    private assessmentFormService: AssessmentFormService,
    private assessmentService: AssessmentService,
    private errorService: ErrorHandlerService,
    public translations: PsiraTranslations,
    private messageService: NzMessageService,
    private modalService: NzModalService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    combineLatest([
      this.activatedRoute.params.pipe(
        map((params) => +params?.questionnaireIndex),
        filter((idx) => !isNaN(idx))
      ),
      this.assessmentFormService.assessment$.pipe(filter((assessment) => !!assessment)),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([idx, assessment]) => {
        this.assessment = assessment;
        this.screens = this.buildScreens(assessment);
        this.currentScreenIdx = Math.max(0, Math.min(idx, this.screens.length - 1));
        this.currentScreen = this.screens[this.currentScreenIdx];
        this.answers = assessment.questionnaireAssessment.answers || [];
        this.mapped = this.buildMappedAnswers(this.answers);
        this.assessmentFormService.setQuestionnaire(this.currentScreen?.questionnaires?.[0] || null);
      });
  }

  public isVisible(questionnaire: any, question: Question): boolean {
    if (!question.relevant) return true;
    try {
      return SkipLogic.create(question, this.allQuestions(), this.currentOccurrenceAnswers(questionnaire));
    } catch (err) {
      this.errorService.handleError(err, {
        prefix: `Unable to create skip logic of "${question.relevant}" for "${question.name}"`,
      });
      return true;
    }
  }

  public async next(): Promise<void> {
    if (!await this.confirmScreenRequiredAnswers()) return;

    if (this.currentScreenIdx < this.screens.length - 1) {
      this.goToScreen(this.currentScreenIdx + 1);
      return;
    }

    this.completeAssessment();
  }

  public previous(): void {
    if (this.currentScreenIdx <= 0) return;
    this.goToScreen(this.currentScreenIdx - 1);
  }

  public goToScreen(index: number): void {
    this.router.navigate(['/assessment/questionnaire', index], {
      queryParamsHandling: 'merge',
    });
    setTimeout(() => this.scrollToTop(), 200);
  }

  public addTableAnswer(questionnaire: QuestionnaireVersion, questionId: string, value: string): void {
    this.assessmentFormService
      .addAnswerForQuestionnaire(questionnaire, { question: questionId, textValue: value?.toString() })
      .subscribe(
        (answers) => {
          this.answers = answers;
          this.mapped = this.buildMappedAnswers(answers);
        },
        (err) => this.errorService.handleError(err, { prefix: 'Unable to answer question' })
      );
  }

  public mappedKey(questionnaire: any, questionId: string): string {
    return `${questionnaire?.occurrenceId || 'single'}:${questionId}`;
  }

  public isLastScreen(): boolean {
    return this.currentScreenIdx >= this.screens.length - 1;
  }

  public screenProgress(): string {
    return `${this.currentScreenIdx + 1} / ${this.screens.length}`;
  }

  public hasHtml(value: string): boolean {
    return !!this.htmlText(value);
  }

  public questionnaireTitle(questionnaire: any): string {
    return questionnaire?.sourceBundleId
      ? questionnaire?.questionnaireDisplayTitle || ''
      : questionnaire?.name;
  }

  public shouldShowQuestionnaireTitle(questionnaire: any): boolean {
    return questionnaire?.showQuestionnaireTitle !== false && this.hasHtml(this.questionnaireTitle(questionnaire));
  }

  public shouldShowBundleHeader(): boolean {
    if (!this.hasHtml(this.currentScreen?.bundleHeaderHtml)) return false;
    const previousScreen = this.screens[this.currentScreenIdx - 1];
    return !previousScreen || previousScreen.sourceBundleId !== this.currentScreen.sourceBundleId;
  }

  public shouldShowScreenHeader(): boolean {
    return !!this.currentScreen?.sourceBundleId || this.screens.length > 1;
  }

  private completeAssessment(): void {
    const id = this.assessment.questionnaireAssessment._id;
    forkJoin([
      this.translate.get(this.translations.assessmentForm.complete),
      this.assessmentService.changeAssessmentStatus(id, AssessmentStatus.COMPLETED),
    ]).subscribe(
      ([translation]) => {
        this.messageService.success(translation, { nzDuration: 5000 });
        this.completed = true;
        this.assessment.questionnaireAssessment.status = AssessmentStatus.COMPLETED;
      },
      (err) => this.errorService.handleError(err, { prefix: `Unable to complete assessment with ID "${id}"` })
    );
  }

  private async confirmScreenRequiredAnswers(): Promise<boolean> {
    const missing = this.requiredQuestionsForScreen().filter(({ questionnaire, question }) => {
      if (!this.isVisible(questionnaire, question)) return false;
      return !this.findAnswer(questionnaire, question._id)?.valid;
    });

    if (!missing.length) return true;

    const modal = this.modalService.confirm({
      nzOnCancel: () => false,
      nzOnOk: () => true,
      nzCancelText: this.translate.instant('modal.cancel'),
      nzOkText: this.translate.instant('modal.ok'),
      nzTitle: this.translate.instant('modal.continue'),
      nzWidth: 800,
      nzClosable: false,
      nzContent: this.translate.instant('modal.unansweredQuestions', { count: missing.length }),
    });

    const shouldContinue = await modal.afterClose.toPromise();
    return !!shouldContinue;
  }

  private buildScreens(assessment: FullAssessment): AssessmentScreen[] {
    const questionnaires = assessment.questionnaireAssessment.questionnaires || [];
    const grouped = new Map<string, AssessmentScreen>();

    questionnaires.forEach((questionnaire: any, index: number) => {
      const screenId = questionnaire.screenId || `questionnaire-${questionnaire.occurrenceId || questionnaire._id || index}`;
      const label = questionnaire.screenLabel || '';
      if (!grouped.has(screenId)) {
        grouped.set(screenId, {
          id: screenId,
          label,
          sourceBundleId: questionnaire.sourceBundleId,
          headerHtml: questionnaire.screenHeaderHtml,
          footerHtml: questionnaire.screenFooterHtml,
          bundleHeaderHtml: questionnaire.bundleHeaderHtml,
          bundleNoticeHtml: questionnaire.bundleNoticeHtml,
          questionnaires: [],
        });
      }
      grouped.get(screenId).questionnaires.push(questionnaire);
    });

    return Array.from(grouped.values()).filter((screen) => screen.questionnaires.length);
  }

  private buildMappedAnswers(answers: Answer[]): any {
    return (answers || []).reduce((mapped: any, answer: Answer) => {
      mapped[`${answer.occurrenceId || 'single'}:${answer.question}`] = answer.textValue;
      return mapped;
    }, {});
  }

  private requiredQuestionsForScreen(): Array<{ questionnaire: any; question: Question }> {
    return (this.currentScreen?.questionnaires || [])
      .map((questionnaire: any) =>
        this.questionsForQuestionnaire(questionnaire)
          .filter((question: any) => question.required === true && question.type !== 'note')
          .map((question: Question) => ({ questionnaire, question }))
      )
      .flat();
  }

  private questionsForQuestionnaire(questionnaire: any): Question[] {
    return (questionnaire.questionGroups || [])
      .map((group: any) => [
        ...(group.questions || []),
        ...(group.uniqueQuestions || []).map((unique: any) => unique.subQuestions || []).flat(),
      ])
      .flat();
  }

  private allQuestions(): Question[] {
    return (this.assessment?.questionnaireAssessment?.questionnaires || [])
      .map((questionnaire: any) => this.questionsForQuestionnaire(questionnaire))
      .flat();
  }

  private currentOccurrenceAnswers(questionnaire: any): Answer[] {
    const occurrenceId = questionnaire?.occurrenceId || null;
    return (this.answers || []).filter((answer: any) => (answer.occurrenceId || null) === occurrenceId);
  }

  private findAnswer(questionnaire: any, questionId: string): Answer {
    const occurrenceId = questionnaire?.occurrenceId || null;
    return (this.answers || []).find(
      (answer: any) => answer.question === questionId && (answer.occurrenceId || null) === occurrenceId
    );
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private htmlText(value: string): string {
    const document = new DOMParser().parseFromString(value || '', 'text/html');
    return (document.body.textContent || '').split('\u00a0').join(' ').trim();
  }
}
