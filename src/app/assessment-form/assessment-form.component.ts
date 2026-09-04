import { Component, OnInit } from '@angular/core';
import { AssessmentFormService } from './assessment-form.service';
import { ActivatedRoute } from '@angular/router';
import { map, filter } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AssessmentStatus, FullAssessment } from '@app/pages/assessment/@types/assessment';
import { TranslationCode } from '../@shared/@types/translation';
import { I18nService } from '@app/i18n/i18n.service';

@UntilDestroy()
@Component({
  selector: 'app-assessment-form',
  templateUrl: './assessment-form.component.html',
  styleUrls: ['./assessment-form.component.scss'],
})
export class AssessmentFormComponent implements OnInit {
  public assessment: any;
  public AssessmentStatus = AssessmentStatus;

  constructor(
    public assessmentFormService: AssessmentFormService,
    private activatedRoute: ActivatedRoute,
    private i18nService: I18nService
  ) {
    this.activatedRoute.data
      .pipe(
        map((data) => data?.assessment),
        filter((a) => !!a),
        untilDestroyed(this),
      )
      .subscribe((oldAssessment: FullAssessment) => {
      const assessment = structuredClone(oldAssessment);
      this.applyResolvedQuestionnaireSequence(assessment);
      for (const questionnaire of assessment.questionnaireAssessment.questionnaires) {
        questionnaire.questionGroups.map((group: any) => {
          const questions: any[] = []
          const uniqueQuestions = {};
          group.questions.map((question: { appearance: string; choices: any[]; type: any }) => {
              if (group.appearance?.toLowerCase() === 'table-list' && question.type === 'select_one') {
                  const choices = question.choices.map((choice: { label: any; }) => choice.label)
                  if (!uniqueQuestions[JSON.stringify(choices)]) {
                      uniqueQuestions[JSON.stringify(choices)] = {
                          questions: [],
                          choices: question.choices
                      };
                  }
                  delete question.choices;
                  delete question.appearance;
                  uniqueQuestions[JSON.stringify(choices)].questions.push(
                      question,
                  );
                  return;
              }
              questions.push(question)
          })
          group.questions = questions
          group.uniqueQuestions = Object.values(uniqueQuestions).map(
              (value: any) => ({
                  label: group.label,
                  appearance: 'table-list',
                  subQuestions: value.questions,
                  choices: value.choices,
              }),
          );
      })
    }
        this.assessmentFormService.setAssessment(assessment);
        const [lang] = assessment.questionnaireAssessment.questionnaires.map((q: any) => q.questionnaire?.language) ?? [
          TranslationCode.EN,
        ];
        this.i18nService.setSupportedLanguages([lang]);
        this.i18nService.language = lang;
      });
  }

  ngOnInit() {
  }

  private applyResolvedQuestionnaireSequence(assessment: FullAssessment): void {
    const resolvedQuestionnaires = assessment.questionnaireAssessment?.resolvedQuestionnaires || [];
    if (!resolvedQuestionnaires.length) return;

    const questionnairesById = new Map(
      (assessment.questionnaireAssessment.questionnaires || []).map((questionnaire: any) => [questionnaire._id, questionnaire])
    );

    assessment.questionnaireAssessment.questionnaires = resolvedQuestionnaires
      .slice()
      .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
      .map((resolved: any) => {
        const questionnaire = questionnairesById.get(resolved.questionnaireId);
        if (!questionnaire) return null;

        return {
          ...structuredClone(questionnaire),
          occurrenceId: resolved.occurrenceId,
          resolvedPath: resolved.path,
          sourceBundleId: resolved.sourceBundleId,
          screenId: resolved.screenId,
          screenLabel: resolved.screenLabel,
          screenHeaderHtml: resolved.screenHeaderHtml,
          screenFooterHtml: resolved.screenFooterHtml,
          bundleHeaderHtml: resolved.bundleHeaderHtml,
          bundleNoticeHtml: resolved.bundleNoticeHtml,
          questionnaireDisplayTitle: resolved.questionnaireDisplayTitle,
          showQuestionnaireTitle: resolved.showQuestionnaireTitle,
          screenIndex: resolved.screenIndex,
        };
      })
      .filter((questionnaire: any) => !!questionnaire) as any;
  }
}
