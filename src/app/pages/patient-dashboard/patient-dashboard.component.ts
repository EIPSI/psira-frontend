import { Component, OnInit } from '@angular/core';
import { AssessmentService } from '@app/pages/assessment/@services/assessment.service';
import { PatientsService } from '@app/pages/patients-management/@services/patients.service';
import { User } from '@app/pages/user-management/@types/user';
import { FormattedAssessment } from '@app/pages/assessment/@types/assessment';
import { Convert } from '@app/@shared/classes/convert';
import { finalize } from 'rxjs/operators';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { environment } from '@env/environment';
import { Router } from '@angular/router';
import { LocationStrategy } from '@angular/common';

const CryptoJS = require('crypto-js');

@Component({
  selector: 'app-patient-dashboard',
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.scss']
})
export class PatientDashboardComponent implements OnInit {
  user: User;
  assessments: FormattedAssessment[] = [];
  loading = false;

  constructor(
    private assessmentService: AssessmentService,
    private patientsService: PatientsService,
    private errorService: ErrorHandlerService,
    private router: Router,
    private locationStrategy: LocationStrategy
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.getPatientData();
  }

  getPatientData() {
    this.loading = true;
    this.patientsService
      .patients({
        filter: { email: { eq: this.user.email } },
      })
      .subscribe(
        ({ data }: any) => {
          const patient = data.patients.edges[0]?.node;
          if (patient) {
            this.getAssessments(patient.id);
          } else {
            this.getAssessments();
          }
        },
        (error) => {
          this.getAssessments();
          this.errorService.handleError(error, { prefix: 'Unable to load patient data' });
        }
      );
  }

  getAssessments(patientId?: number) {
    const orFilter: any[] = [{ targetUserId: { eq: this.user.id } }];
    if (patientId) {
      orFilter.push({ patientId: { eq: patientId } });
    }
    this.assessmentService
      .getAssessments({
        filter: {
          and: [{ or: orFilter }, { deleted: { is: false } }],
        },
        sorting: [{ field: 'createdAt', direction: 'DESC' }],
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ edges }) => {
          this.assessments = edges.map((e: any) => Convert.toFormattedAssessment(e.node));
        },
        (error) => {
          this.errorService.handleError(error, { prefix: 'Unable to load assessments' });
        }
      );
  }

  startAssessment(assessment: FormattedAssessment) {
    const cryptoId = CryptoJS.AES.encrypt(assessment.uuid, environment.secretKey).toString();
    const tree = this.router.createUrlTree(['/assessment/overview'], {
      queryParams: {
        assessment: cryptoId
      }
    });
    const url = this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
    window.open(url, '_blank');
  }
}
