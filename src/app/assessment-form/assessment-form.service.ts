import { Injectable } from '@angular/core';
import { FullAssessment } from '@app/pages/assessment/@types/assessment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { AnswerAssessmentInput, Answer } from './@types/answer';
import { AssessmentService } from '../pages/assessment/@services/assessment.service';
import { QuestionnaireVersion } from '@app/pages/questionnaire-management/@types/questionnaire';
import { first, switchMap, tap, catchError } from 'rxjs/operators';
import { Question } from './@types/question';
import { isApolloError } from 'apollo-client';

@Injectable({ providedIn: 'root' })
export class AssessmentFormService {
  private _assessment = new BehaviorSubject<FullAssessment>(null);
  private _questionnaire = new BehaviorSubject<QuestionnaireVersion>(null);
  private _assessmentInfo: {
    questions?: Question[];
    answers?: Answer[];
    percentage?: number;
  } = {};

  public get assessment$(): Observable<FullAssessment> {
    return this._assessment.asObservable();
  }

  public get assessmentSnapshot(): FullAssessment {
    return this._assessment.value;
  }

  public get questionnaire$(): Observable<QuestionnaireVersion> {
    return this._questionnaire.asObservable();
  }

  public get questionnaireSnapshot(): any {
    return this._questionnaire.value;
  }

  public get percentageCompleted(): number {
    return this._assessmentInfo?.percentage ?? 0;
  }

  constructor(private assessmentService: AssessmentService) {}

  public setAssessment(assessment: FullAssessment): void {
    this._assessment.next(assessment);
    this.prepareAssessmentInfo(assessment);
  }

  public setQuestionnaire(questionnaireVersion: QuestionnaireVersion): void {
    this._questionnaire.next(questionnaireVersion);
  }

  public setAnswers(answers: Answer[]): void {
    this.setAssessment({
      ...this._assessment.value,
      questionnaireAssessment: {
        ...this._assessment.value?.questionnaireAssessment,
        answers,
      },
    });
  }

  public addAnswer(answerInput: Omit<AnswerAssessmentInput, 'assessmentId' | 'questionnaireVersionId'>) {
    const occurrenceId = this.questionnaireSnapshot?.occurrenceId || null;
    return this.questionnaire$.pipe(
      first(),
      switchMap((questionnaire) =>
        // upload answer
        this.assessmentService.addAnswer({
          ...answerInput,
          occurrenceId,
          assessmentId: this._assessment.value.questionnaireAssessment._id,
          questionnaireVersionId: questionnaire._id,
        })
      ),
      catchError((err: any) => {
        // invalidate answer if its bad user input
        if (isApolloError(err) && err.graphQLErrors.some((e) => e.extensions?.code === 'BAD_USER_INPUT')) {
          const answers = this.assessmentSnapshot.questionnaireAssessment.answers;
          const answer = answers.find(
            (a) =>
              a.question === answerInput.question &&
              (a.occurrenceId || null) === occurrenceId
          );
          if (answer) {
            answer.valid = false;
            this.setAnswers(answers);
          }
        }

        // rethrow error
        return throwError(err);
      }),
      // update answers with successfull server response
      tap((answers) => this.setAnswers(answers))
    );
  }

  public addAnswerForQuestionnaire(
    questionnaire: QuestionnaireVersion,
    answerInput: Omit<AnswerAssessmentInput, 'assessmentId' | 'questionnaireVersionId'>
  ) {
    const occurrenceId = (questionnaire as any)?.occurrenceId || null;
    return this.assessmentService
      .addAnswer({
        ...answerInput,
        occurrenceId,
        assessmentId: this._assessment.value.questionnaireAssessment._id,
        questionnaireVersionId: questionnaire._id,
      })
      .pipe(
        catchError((err: any) => {
          if (isApolloError(err) && err.graphQLErrors.some((e) => e.extensions?.code === 'BAD_USER_INPUT')) {
            const answers = this.assessmentSnapshot.questionnaireAssessment.answers;
            const answer = answers.find(
              (a) =>
                a.question === answerInput.question &&
                (a.occurrenceId || null) === occurrenceId
            );
            if (answer) {
              answer.valid = false;
              this.setAnswers(answers);
            }
          }
          return throwError(err);
        }),
        tap((answers) => this.setAnswers(answers))
      );
  }

  private prepareAssessmentInfo(assessment: FullAssessment) {
    this._assessmentInfo.questions = assessment.questionnaireAssessment.questionnaires
      .map((q: any) => q.questionGroups.map((g: any) => g.questions).flat())
      .flat();
    this._assessmentInfo.answers = assessment.questionnaireAssessment.answers;
    const requiredQuestions = assessment.questionnaireAssessment.questionnaires
      .map((questionnaire: any) => {
        const occurrenceId = questionnaire.occurrenceId || null;
        const groupQuestions = questionnaire.questionGroups.map((g: any) => g.questions).flat();
        const uniqueQuestions = questionnaire.questionGroups
          .map((g: any) => g.uniqueQuestions)
          .flat(2)
          .map((el: any) => el.subQuestions)
          .flat();

        return groupQuestions
          .concat(uniqueQuestions)
          .filter((question: any) => question.required)
          .map((question: any) => ({ question, occurrenceId }));
      })
      .flat();

    const numAnswers = requiredQuestions.reduce((sum: number, item: any) => {
      const answer = this._assessmentInfo.answers.find(
        (a: any) => a.question === item.question._id && (a.occurrenceId || null) === item.occurrenceId
      );
      return answer?.valid ? (sum += 1) : sum;
    }, 0);
    this._assessmentInfo.percentage = requiredQuestions.length ? (numAnswers / requiredQuestions.length) * 100 : 100;
  }
}
