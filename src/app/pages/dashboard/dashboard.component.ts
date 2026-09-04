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
import { InformedConsentService } from '../informed-consent/@services/informed-consent.service';
import { PendingInformedConsent } from '../informed-consent/@types/informed-consent';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { PermissionKey } from '@shared/@types/permission';
import { CalendarOccurrence, CalendarOccurrenceStatus, CalendarOccurrenceType } from '../calendar/@types/calendar';
import { CalendarService } from '../calendar/@services/calendar.service';
import { DepartmentsService } from '../administration/@services/departments.service';
import { Department } from '../administration/@types/department';
import { formatSystemDateTime } from '@shared/utils/system-settings.util';
import { TranslateService } from '@ngx-translate/core';

const CryptoJS = require('crypto-js');

interface DashboardTimelineItem {
  itemType: 'ASSESSMENT' | 'SESSION';
  activationAt: Date;
  assessment?: FormattedAssessment;
  session?: CalendarOccurrence;
}

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
  public assessmentsLoading = true;
  public sessions: CalendarOccurrence[] = [];
  public sessionsLoading = true;
  public timelineItems: DashboardTimelineItem[] = [];
  public dashboardLookaheadDays = 1;
  public reports: Reports[] = [];
  public reportsLoading = false;
  public pendingConsents: PendingInformedConsent[] = [];
  public consentsLoading = true;
  public calendarHasContent = false;
  public calendarContentKnown = false;
  public selectedTabIndex = 0;
  public departmentFilters: Department[] = [];
  public selectedDepartmentIds: number[] = [];

  constructor(
    public translations: PsiraTranslations,
    private authService: AuthService,
    private disclaimersService: DisclaimersService,
    private errorService: ErrorHandlerService,
    private usersService: UsersService,
    private assessmentService: AssessmentService,
    private calendarService: CalendarService,
    private reportsDashboardService: ReportsDashboardService,
    private informedConsentService: InformedConsentService,
    private departmentsService: DepartmentsService,
    private perms: AppPermissionsService,
    private locationStrategy: LocationStrategy,
    private router: Router,
    private translate: TranslateService
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
        this.loadDepartmentFilters();
        if (this.acceptedTerm) {
          this.getPendingConsents();
        } else {
          this.pendingConsents = [];
          this.consentsLoading = false;
          this.assessmentsLoading = false;
          this.sessionsLoading = false;
          this.assessments = [];
          this.sessions = [];
          this.reports = [];
        }
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
          if (this.acceptedTerm) {
            this.getPendingConsents();
          }
        },
        (error) => {
          this.errorService.handleError(error, {});
        }
      );
  }

  public startAssessment(assessment: FormattedAssessment): void {
    if (!this.isAssessmentAvailable(assessment)) return;
    const cryptoId = CryptoJS.AES.encrypt(assessment.uuid, environment.secretKey).toString();
    const tree = this.router.createUrlTree(['/assessment/overview'], {
      queryParams: { assessment: cryptoId },
    });
    const url = this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
    window.open(url, '_blank');
  }

  public openPendingConsent(consent: PendingInformedConsent): void {
    const tree = this.router.createUrlTree(['/informed-consent/pending'], {
      queryParams: {
        managementId: consent.managementId,
        token: this.publicConsentToken(),
      },
    });
    const url = this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
    window.open(url, '_blank');
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
    const now = new Date();
    const visibleUntil = this.dashboardVisibleUntil();
    this.assessmentsLoading = true;
    this.assessmentService
      .getAssessments({
        filter: {
          and: [
            { responderUserId: { eq: this.user.id } },
            { or: [{ deleted: { is: false } }, { deleted: { is: null } }] },
            { status: { in: ['PLANNED', 'OPEN_FOR_COMPLETION'] } },
            { or: [{ deliveryDate: { lte: visibleUntil } }, { deliveryDate: { is: null } }] },
            { or: [{ expirationDate: { gt: now } }, { expirationDate: { is: null } }] },
          ],
        },
        sorting: [{ field: 'deliveryDate', direction: 'ASC' }],
      })
      .pipe(finalize(() => (this.assessmentsLoading = false)))
      .subscribe(
        ({ edges }) => {
          this.assessments = edges.map((e: any) => Convert.toFormattedAssessment(e.node));
          this.updateTimelineItems();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load assessments' })
      );
  }

  private getPendingConsents(): void {
    this.consentsLoading = true;
    this.informedConsentService
      .getPending()
      .pipe(finalize(() => (this.consentsLoading = false)))
      .subscribe(
        (pending) => {
          this.pendingConsents = pending || [];
          if (this.hasBlockingInformedConsent() || this.hasMandatoryPendingConsents()) {
            this.assessments = [];
            this.sessions = [];
            this.timelineItems = [];
            this.reports = [];
            this.assessmentsLoading = false;
            this.sessionsLoading = false;
            this.reportsLoading = false;
            return;
          }
          this.loadClinicalSettingsForDashboard();
          this.getDashboardReports();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load informed consents' })
      );
  }

  public hasMandatoryPendingConsents(): boolean {
    return this.pendingConsents.some((consent) => consent.mandatory);
  }

  public hasBlockingInformedConsent(): boolean {
    return this.blockingConsents().length > 0;
  }

  public blockingConsents(): PendingInformedConsent[] {
    return this.pendingConsents.filter((consent) => consent.blocking);
  }

  public answerablePendingConsents(): PendingInformedConsent[] {
    if (this.hasBlockingInformedConsent()) return [];
    return this.pendingConsents.filter((consent) => !consent.blocking);
  }

  public pendingItemsCount(): number {
    if (this.hasBlockingInformedConsent()) return this.blockingConsents().length;
    return this.answerablePendingConsents().length + this.visibleTimelineItems().length;
  }

  public totalPendingItemsCount(): number {
    if (this.hasBlockingInformedConsent()) return this.blockingConsents().length;
    return this.answerablePendingConsents().length + this.timelineItems.length;
  }

  public showGeneralTab(): boolean {
    if (!this.user) return true;
    return !this.acceptedTerm || this.consentsLoading || this.assessmentsLoading || this.sessionsLoading || this.totalPendingItemsCount() > 0;
  }

  public showReportsTab(): boolean {
    if (this.hasBlockingInformedConsent() || this.hasMandatoryPendingConsents()) return false;
    return this.canViewReports() && (this.reportsLoading || this.reports.length > 0);
  }

  public showCalendarTab(): boolean {
    if (this.hasBlockingInformedConsent() || this.hasMandatoryPendingConsents()) return false;
    return !this.calendarContentKnown || this.calendarHasContent;
  }

  public onCalendarContentChange(hasContent: boolean): void {
    this.calendarContentKnown = true;
    this.calendarHasContent = hasContent;
  }

  public hasAnyVisibleTab(): boolean {
    return this.showGeneralTab() || this.showCalendarTab() || this.showReportsTab();
  }

  public visibleTimelineItems(): DashboardTimelineItem[] {
    if (!this.selectedDepartmentIds.length) return this.timelineItems;
    const selected = this.selectedDepartmentIds.map((id) => Number(id));
    return this.timelineItems.filter((item) =>
      this.itemDepartmentIds(item).some((id) => selected.includes(Number(id)))
    );
  }

  public departmentMarkerColor(item: DashboardTimelineItem): string {
    const id = this.itemDepartmentIds(item)[0];
    if (!id) return '#98a2b3';
    return this.departmentColor(id);
  }

  public departmentBadges(item: DashboardTimelineItem): Array<{ id: number; name: string; color: string; background: string }> {
    return this.itemDepartments(item).map((department: any) => ({
      id: Number(department.id),
      name: department.name,
      color: this.departmentColor(department.id),
      background: this.departmentPastelColor(department.id),
    }));
  }

  private canViewReports(): boolean {
    return this.perms.permissionsOnly([PermissionKey.REPORTS_VIEW_DEPARTMENT]);
  }

  private getDashboardReports(): void {
    if (!this.canViewReports()) {
      this.reports = [];
      return;
    }
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

  private loadClinicalSettingsForDashboard(): void {
    this.calendarService.getClinicalSessionFollowUpSettings().subscribe(
      (settings) => {
        this.dashboardLookaheadDays = Math.max(0, Number(settings?.dashboardLookaheadDays ?? 1));
        this.getPendingAssessments();
        this.getUpcomingSessions();
      },
      () => {
        this.dashboardLookaheadDays = 1;
        this.getPendingAssessments();
        this.getUpcomingSessions();
      }
    );
  }

  private getUpcomingSessions(): void {
    const now = new Date();
    this.sessionsLoading = true;
    this.calendarService
      .getOccurrences({
        from: now,
        to: this.dashboardVisibleUntil(),
      })
      .pipe(finalize(() => (this.sessionsLoading = false)))
      .subscribe(
        (occurrences) => {
          this.sessions = (occurrences || [])
            .filter((occurrence) =>
              [CalendarOccurrenceType.CLINICAL_SESSION, CalendarOccurrenceType.SUPERVISION].includes(occurrence.occurrenceType) &&
              ![CalendarOccurrenceStatus.CANCELLED, CalendarOccurrenceStatus.DETACHED].includes(occurrence.status)
            )
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
          this.updateTimelineItems();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load upcoming sessions' })
      );
  }

  public isAssessmentAvailable(assessment: FormattedAssessment): boolean {
    return !assessment.deliveryDate || new Date(assessment.deliveryDate).getTime() <= Date.now();
  }

  private updateTimelineItems(): void {
    this.timelineItems = [
      ...this.assessments.map((assessment) => ({
        itemType: 'ASSESSMENT' as const,
        activationAt: assessment.deliveryDate ? new Date(assessment.deliveryDate) : new Date(0),
        assessment,
      })),
      ...this.sessions.map((session) => ({
        itemType: 'SESSION' as const,
        activationAt: new Date(session.startAt),
        session,
      })),
    ].sort((a, b) => a.activationAt.getTime() - b.activationAt.getTime());
  }

  public assessmentActivationLabel(assessment: FormattedAssessment): string {
    return assessment.deliveryDate
      ? this.translate.instant('dashboard.activation', { date: formatSystemDateTime(assessment.deliveryDate) })
      : this.translate.instant('dashboard.immediateActivation');
  }

  public assessmentExpirationLabel(assessment: FormattedAssessment): string {
    return assessment.expirationDate
      ? this.translate.instant('dashboard.expiration', { date: formatSystemDateTime(assessment.expirationDate) })
      : this.translate.instant('dashboard.noExpiration');
  }

  public formatDashboardDateTime(date: string | Date): string {
    return formatSystemDateTime(date);
  }

  public sessionTitle(session: CalendarOccurrence): string {
    const number = session.clinicalSession?.sessionNumber ? `Sesion ${session.clinicalSession.sessionNumber}` : 'Sesion';
    const person = this.sessionPersonLabel(session);
    return person ? `${number}: ${person}` : number;
  }

  public sessionKindLabel(session: CalendarOccurrence): string {
    return session.occurrenceType === CalendarOccurrenceType.SUPERVISION
      ? 'Supervision'
      : 'Sesion clinica';
  }

  private sessionPersonLabel(session: CalendarOccurrence): string {
    const currentUserId = Number(this.user?.id || 0);

    if (session.occurrenceType === CalendarOccurrenceType.SUPERVISION) {
      if (session.therapistId && Number(session.therapistId) === currentUserId) {
        return this.personName(session.supervisor);
      }
      if (
        session.supervisorId && Number(session.supervisorId) === currentUserId ||
        (session.responsibleUsers || []).some((user) => Number(user.id) === currentUserId)
      ) {
        return this.personName(session.therapist);
      }
      const therapist = this.personName(session.therapist);
      const supervisor = this.personName(session.supervisor);
      return [therapist, supervisor]
        .filter(Boolean)
        .join(' / ');
    }

    if (session.patient?.userId && Number(session.patient.userId) === currentUserId) {
      return this.personName(session.therapist);
    }

    const patient = this.personName(session.patient);
    if (patient) return patient;
    if (session.therapist) return this.personName(session.therapist);
    if (session.supervisor) return this.personName(session.supervisor);
    return '';
  }

  public sharedDepartmentNames(session: CalendarOccurrence): string {
    return this.departmentNames(this.sharedDepartments(session));
  }

  private departmentNames(departments: any[]): string {
    return [...new Set((departments || []).map((department: any) => department.name).filter(Boolean))].join(', ');
  }

  private primaryDyadMember(session: CalendarOccurrence): any {
    return session.occurrenceType === CalendarOccurrenceType.SUPERVISION
      ? session.therapist
      : session.patient;
  }

  private secondaryDyadMember(session: CalendarOccurrence): any {
    return session.occurrenceType === CalendarOccurrenceType.SUPERVISION
      ? session.supervisor
      : session.therapist;
  }

  private personName(person?: { firstName?: string; middleName?: string; lastName?: string }): string {
    if (!person) return '';
    return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');
  }

  private dashboardVisibleUntil(): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.dashboardLookaheadDays);
    return date;
  }

  private publicConsentToken(): string {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);
    return CryptoJS.AES.encrypt(
      JSON.stringify({ userId: this.user.id, exp: expiresAt.getTime() }),
      environment.secretKey
    ).toString();
  }

  private loadDepartmentFilters(): void {
    if (this.perms.isSuperAdmin()) {
      this.departmentsService
        .departments({ paging: { first: 50 }, sorting: [{ field: 'name', direction: 'ASC' }] as any })
        .subscribe(
          ({ data }: any) => {
            this.departmentFilters = (data.departments.edges || []).map((edge: any) => edge.node);
          },
          () => {
            this.departmentFilters = [];
          }
        );
      return;
    }

    this.departmentFilters = this.user?.departments || [];
  }

  private itemDepartmentIds(item: DashboardTimelineItem): number[] {
    return this.itemDepartments(item).map((department: any) => Number(department.id)).filter(Boolean);
  }

  private itemDepartments(item: DashboardTimelineItem): any[] {
    if (item.itemType === 'SESSION' && item.session) {
      return this.uniqueDepartments(this.sharedDepartments(item.session));
    }
    const patientDepartments = (item.assessment?.patient as any)?.departments || [];
    const targetDepartments = (item.assessment?.targetUser as any)?.departments || [];
    return this.uniqueDepartments([...patientDepartments, ...targetDepartments]);
  }

  private sharedDepartments(session: CalendarOccurrence): any[] {
    const left = this.primaryDyadMember(session);
    const right = this.secondaryDyadMember(session);
    const leftDepartments = left?.departments || [];
    const rightDepartments = right?.departments || [];
    if (!leftDepartments.length && !rightDepartments.length) return [];
    if (!leftDepartments.length) return rightDepartments;
    if (!rightDepartments.length) return leftDepartments;
    const rightDepartmentIds = rightDepartments.map((department: any) => Number(department.id));
    return leftDepartments.filter((department: any) => rightDepartmentIds.includes(Number(department.id)));
  }

  private uniqueDepartments(departments: any[]): any[] {
    const byId = new Map<number, any>();
    for (const department of departments || []) {
      if (!department?.id) continue;
      byId.set(Number(department.id), department);
    }
    return Array.from(byId.values());
  }

  private departmentColor(id: number): string {
    const colors = ['#186fb5', '#2f9e44', '#d9480f', '#7048e8', '#0b7285', '#c92a2a', '#5c7cfa'];
    return colors[Math.abs(Number(id || 0)) % colors.length];
  }

  private departmentPastelColor(id: number): string {
    const colors = ['#d9ecfb', '#def3e6', '#fde7dc', '#ebe4ff', '#dff3f6', '#f9dddd', '#e4e8ff'];
    return colors[Math.abs(Number(id || 0)) % colors.length];
  }
}
