import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { environment } from '@env/environment';
import { questions } from '@app/questionnaire/do-assessment/data';
import { encryptRoutePayload, decryptRoutePayload } from '@app/@shared/utils/route-crypto.util';

@Component({
  selector: 'app-do-assessment',
  templateUrl: './do-assessment.component.html',
  styleUrls: ['./do-assessment.component.scss'],
})
export class DoAssessmentComponent implements OnInit {
  questionnaire: any;
  currentQuestionIndex = 0;

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.getQuestionnaire();
  }

  getQuestionnaire() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params.questionnaire) {
        const bytes = decryptRoutePayload(params.questionnaire, environment.secretKey);
        this.questionnaire = JSON.parse(bytes);
        this.questionnaire.questions = questions;
      }
    });
  }

  getNextQuestion() {
    if (this.questionnaire.questions.length > this.currentQuestionIndex) {
      this.currentQuestionIndex = this.currentQuestionIndex + 1;
    }
  }

  getPreviousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex = this.currentQuestionIndex - 1;
    }
  }
}
