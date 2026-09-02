import { Component, OnInit } from '@angular/core';
import { QuestionnaireVersion } from '@app/pages/questionnaire-management/@types/questionnaire';
import { QuestionnaireManagementService } from '@app/pages/questionnaire-management/@services/questionnaire-management.service';
import { environment } from '@env/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionnaireModel } from '@app/pages/questionnaire-management/@models/questionnaire.model';
import { finalize } from 'rxjs/operators';
import { Convert } from '@shared/classes/convert';

const CryptoJS = require('crypto-js');

@Component({
  selector: 'app-questionnaire-profile',
  templateUrl: './questionnaire-profile.component.html',
  styleUrls: ['./questionnaire-profile.component.scss'],
})
export class QuestionnaireProfileComponent implements OnInit {
  questionnaire: QuestionnaireVersion;
  versionsVisible = false;
  previewVisible = false;
  versionsLoading = false;
  oldVersions: QuestionnaireVersion[] = [];
  selectedVersion?: QuestionnaireVersion;

  get questionnaireTitle(): string {
    const name = [this.questionnaire?.name].filter((s) => !!s).join(' ');
    return [name].filter((s) => !!s).join(' - ');
  }

  constructor(
    private qmService: QuestionnaireManagementService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getQuestionnaire();
  }

  getQuestionnaire() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params.questionnaire) {
        const bytes = CryptoJS.AES.decrypt(params.questionnaire, environment.secretKey);
        const questionnaire = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        this.questionnaire = QuestionnaireModel.fromJson(questionnaire);
      }
    });
  }

  openVersions(): void {
    if (!this.questionnaire) return;
    const questionnaire: any = this.questionnaire;
    const language = questionnaire.language || questionnaire.questionnaire?.language;
    const abbreviation = questionnaire.abbreviation || questionnaire.questionnaire?.abbreviation;
    this.versionsVisible = true;
    this.selectedVersion = undefined;
    this.versionsLoading = true;
    this.qmService
      .getQuestionnairesVersion({
        paging: { first: 50 },
        filter: {
          and: [
            { zombie: { is: true } },
            { language: { eq: language } },
            { abbreviation: { eq: abbreviation } },
          ],
        },
        sorting: [{ field: 'createdAt', direction: 'DESC' }],
      })
      .pipe(finalize(() => (this.versionsLoading = false)))
      .subscribe(({ edges }) => {
        this.oldVersions = edges.map((edge: any) => Convert.toFormattedQuestionnaireVersion2(edge.node));
      });
  }

  selectVersion(version: QuestionnaireVersion): void {
    this.selectedVersion = version;
  }

  versionLanguage(version?: QuestionnaireVersion): string {
    const value: any = version;
    return value?.language || value?.questionnaire?.language || '-';
  }

  versionAbbreviation(version?: QuestionnaireVersion): string {
    const value: any = version;
    return value?.abbreviation || value?.questionnaire?.abbreviation || '-';
  }

  previewQuestionGroups(): any[] {
    return (this.questionnaire as any)?.questionGroups || [];
  }
}
