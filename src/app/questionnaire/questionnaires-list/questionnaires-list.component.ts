import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '@env/environment';
import { NzModalService } from 'ng-zorro-antd';
import { TranslateService } from '@ngx-translate/core';
import { encryptRouteObject, encryptRoutePayload, decryptRoutePayload } from '@app/@shared/utils/route-crypto.util';

@Component({
  selector: 'app-questionnaires-list',
  templateUrl: './questionnaires-list.component.html',
  styleUrls: ['./questionnaires-list.component.scss'],
})
export class QuestionnairesListComponent implements OnInit {
  description = `Hello Jon, thank your for answering the following assessment. The information you're providing is very important for a proper diagnosis and treatment. Please start the assessment by pressing the button below. The questionnaires are in fixed order`;
  questionnaires: any[] = [
    {
      name: 'Patient Health Questionnaire - 9',
      summary: '9/9 Questions filled',
      fillingTime: 2,
      description: 'This is the simple questionnaire description',
    },
    {
      name: 'PROMISE Pediatric Global Sclase',
      summary: '14/20 Questions filled',
      fillingTime: 2,
      description: 'This is the simple questionnaire description',
    },
    {
      name: 'Levels of Personality Function in Adolescents (LoPF-1218)',
      summary: '0/4 Questions filled',
      fillingTime: 2,
      description: 'This is the simple questionnaire description',
    },
    {
      name: 'Child behaviour Checklist',
      summary: '0/15 Questions filled',
      fillingTime: 2,
      description: 'This is the simple questionnaire description',
    },
  ];
  activeIndex: number;

  constructor(private router: Router, private modal: NzModalService, private translate: TranslateService) {}

  ngOnInit(): void {}

  selectQuestionnaire(index: number) {
    this.activeIndex = index;
  }

  navigateToQuestionnaire() {
    if (this.activeIndex === undefined) {
      this.modal.error({
        nzTitle: this.translate.instant('questionnaireRuntime.cannotStartQuestionnaire'),
        nzContent: this.translate.instant('questionnaireRuntime.selectQuestionnaire'),
      });
      return;
    }
    const dataString = encryptRouteObject(this.questionnaires[this.activeIndex], environment.secretKey);
    this.router.navigate(['/assessment/questionnaire'], {
      queryParams: {
        questionnaire: dataString,
      },
    });
  }
}
