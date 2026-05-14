import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PsiraTranslations } from '../../@core/psira-translations';
import { Disclaimers } from '@app/pages/administration/@types/disclaimers';
import { DisclaimersService } from '@app/pages/administration/@services/disclaimers.service';
import { finalize } from 'rxjs/operators';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { UsersService } from '@app/pages/user-management/@services/users.service';
import { UpdateOneUserInput, User } from '@app/pages/user-management/@types/user';
import { AuthService } from '@app/auth/auth.service';
import { AssessmentService } from '@app/pages/assessment/@services/assessment.service';
import { FormattedAssessment } from '@app/pages/assessment/@types/assessment';
import { Convert } from '@shared/classes/convert';
import { environment } from '@env/environment';
import { LocationStrategy } from '@angular/common';
import { ReportsDashboardService } from './@services/reports.service';
import { Reports } from '@app/pages/administration/@types/reports';

const CryptoJS = require('crypto-js');

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  isVisible = true;
  user: User;
  public disclaimer: Disclaimers;
  public data: Partial<Disclaimers>[];
  public acceptedTerm = true;
  public isLoading = false;
  public assessments: FormattedAssessment[] = [];
  public assessmentsLoading = false;
  public reports: Reports[] = [];
  public reportsLoading = false;

  constructor(
    public translations: PsiraTranslations,
    private authService: AuthService,
    private disclaimersService: DisclaimersService,
    private errorService: ErrorHandlerService,
    private usersService: UsersService,
    private assessmentService: AssessmentService,
    private reportsDashboardService: ReportsDashboardService,
    private locationStrategy: LocationStrategy,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getUser();
    this.getDescription();
  }

  getUser() {
    this.authService.getUserProfile().subscribe(
      ({ data }) => {
        this.user = data.getUserProfile;
        this.acceptedTerm = this.user.acceptedTerm;
        this.getPendingAssessments();
        this.getDashboardReports();
      },
      (err) => this.errorService.handleError(err, { prefix: 'Unable to get user profile' })
    );
  }

  updateUser() {
    const userInput: UpdateOneUserInput = {
      id: this.user.id,
      update: { acceptedTerm: true },
    };
    this.isLoading = true;
    this.usersService
      .updateUserAcceptedTerm(userInput)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        async ({ data }) => {
          this.user = data.updateUserAcceptedTerm;
          this.acceptedTerm = this.user.acceptedTerm;
        },
        (error) => {
          this.errorService.handleError(error, {});
        }
      );
  }

  private getDescription(): void {
    this.disclaimersService
      .disclaimers()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.disclaimer = data.disclaimers.find((disclaimers: any) => disclaimers.type === 'loginDisclaimer');
        },
        (err) => this.errorService.handleError(err, { prefix: 'Unable to load disclaimers' })
      );
  }

  private getPendingAssessments(): void {
    this.assessmentsLoading = true;
    this.assessmentService
      .getAssessments({
        filter: {
          and: [
            { responderUserId: { eq: this.user.id } },
            { deleted: { is: false } },
            { status: { in: ['PLANNED', 'OPEN_FOR_COMPLETION'] } },
          ],
        },
        sorting: [{ field: 'createdAt', direction: 'DESC' }],
      })
      .pipe(finalize(() => (this.assessmentsLoading = false)))
      .subscribe(
        ({ edges }) => {
          this.assessments = edges.map((e: any) => Convert.toFormattedAssessment(e.node));
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load assessments' })
      );
  }

  private getDashboardReports(): void {
    this.reportsLoading = true;
    this.reportsDashboardService
      .getDashboardCaseManagers()
      .pipe(finalize(() => (this.reportsLoading = false)))
      .subscribe(
        ({ data: { getReportsByResource } }: any) => {
          this.reports = getReportsByResource ?? [];
        },
        () => {
          this.reports = [];
        }
      );
  }

  public startAssessment(assessment: FormattedAssessment): void {
    const cryptoId = CryptoJS.AES.encrypt(assessment.uuid, environment.secretKey).toString();
    const tree = this.router.createUrlTree(['/assessment/overview'], {
      queryParams: { assessment: cryptoId },
    });
    const url = this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
    window.open(url, '_blank');
  }
}
