import { Component, Input, OnInit } from '@angular/core';
import { FormattedPatient } from '@app/pages/patients-management/@types/formatted-patient';
import {
  Action,
  ActionArgs,
  DEFAULT_PAGE_SIZE,
  SortField,
  TableColumn,
} from '@shared/@modules/master-data/@types/list';
import { AssessmentsPatientsTable } from '@app/pages/patients-management/@tables/assessments.table';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { CaseManagerFilter } from '@app/pages/patients-management/@types/case-manager-filter';
import { finalize } from 'rxjs/operators';
import { Convert } from '@shared/classes/convert';
import { Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { Sorting } from '@shared/@types/sorting';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { AssessmentService } from '@app/pages/patients-management/@services/assessment.service';
import { PageInfo } from '../../../@shared/@types/paging';
import { FormattedAssessment, FullAssessment } from '@app/pages/assessment/@types/assessment';
import { NzModalService } from 'ng-zorro-antd/modal';
import { LocationStrategy } from '@angular/common';
import { ClipboardService } from 'ngx-clipboard';
import { NzMessageService } from 'ng-zorro-antd/message';
import { User } from '@app/pages/user-management/@types/user';
import { TranslateService } from '@ngx-translate/core';
import { encryptRouteObject, encryptRoutePayload, decryptRoutePayload } from '@app/@shared/utils/route-crypto.util';

enum ActionKey {
  SHOW_ASSESSMENT,
  COPY_ASSESSMENT_LINK,
  ARCHIVE_ASSESSMENT,
  RESTORE_ASSESSMENT,
  DELETE_ASSESSMENT,
  SCAN_QR_CODE,
}

@Component({
  selector: 'app-assessments',
  templateUrl: './assessments.component.html',
  styleUrls: ['./assessments.component.scss'],
})
export class AssessmentsComponent implements OnInit {
  @Input() public patient: FormattedPatient;
  public actions: Action<ActionKey>[] = [
    { key: ActionKey.SHOW_ASSESSMENT, title: 'plannedAssessments.startSession' },
    { key: ActionKey.COPY_ASSESSMENT_LINK, title: 'plannedAssessments.copySessionLink' },
    { key: ActionKey.ARCHIVE_ASSESSMENT, title: 'plannedAssessments.archiveAssessment' },
    { key: ActionKey.RESTORE_ASSESSMENT, title: 'plannedAssessments.restoreAssessment' },
    { key: ActionKey.DELETE_ASSESSMENT, title: 'plannedAssessments.deleteSession' },
    { key: ActionKey.SCAN_QR_CODE, title: 'plannedAssessments.scanQrCode' },
  ];
  public filter: CaseManagerFilter;
  public data: FormattedAssessment[];
  public currentFilters = false;
  public cacheFilters = JSON.parse(localStorage.getItem('filter-patient-assessment'));
  public columns: TableColumn<FormattedAssessment>[] = AssessmentsPatientsTable;
  public user: User;
  public isLoading = false;
  public onlyArchivedAssessments = localStorage.getItem('onlyArchivedAssessmentsPatients') === 'true';
  isVisible = false;
  assessmentModalVisible = false;
  assessmentModalLoading = false;
  editingAssessment?: FullAssessment;
  newUrl: URL;
  modalData: any = '';
  statusFilter = '';
  searchString = '';
  public pageInfo: PageInfo;
  public onlyMyAssessments = localStorage.getItem('onlyMyAssessmentsPatients') === 'true';

  public assessmentRequestOptions: { paging: Paging; filter: Filter; sorting: Sorting[] } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
  };

  constructor(
    private router: Router,
    private assessmentService: AssessmentService,
    private errorService: ErrorHandlerService,
    private clipboardService: ClipboardService,
    private messageService: NzMessageService,
    private locationStrategy: LocationStrategy,
    private modalService: NzModalService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.getAssessments();

    if (!localStorage.getItem('onlyMyAssessmentsPatients')) {
      localStorage.setItem('onlyMyAssessmentsPatients', this.onlyMyAssessments.toString());
    }
    if (!localStorage.getItem('onlyArchivedAssessmentsPatients')) {
      localStorage.setItem('onlyArchivedAssessmentsPatients', this.onlyArchivedAssessments.toString());
    }
    if (!localStorage.getItem('filter-patient-assessment')) {
      localStorage.setItem('filter-patient-assessment', JSON.stringify(this.assessmentRequestOptions.filter));
    }
    if (!localStorage.getItem('sorting-patient-assessment')) {
      localStorage.setItem('sorting-patient-assessment', JSON.stringify(this.assessmentRequestOptions.sorting));
    }
  }

  public onPageChange(paging: Paging): void {
    this.assessmentRequestOptions.paging = paging;
    this.getAssessments();
  }

  public onSort(sorting: SortField<FormattedAssessment>[]): void {
    this.assessmentRequestOptions.sorting = sorting;
    this.getAssessments();
  }

  public onFilter(filter: Filter): void {
    this.assessmentRequestOptions.filter = filter;
    localStorage.setItem('filter-patient-assessment', JSON.stringify(this.assessmentRequestOptions.filter));
    this.getAssessments();
    this.currentFilters = true;
  }

  public onSearch(searchString: string): void {
    this.searchString = searchString || '';
    this.getAssessments();
  }

  public onStatusSelect(): any {
    if (this.assessmentRequestOptions.filter.and) {
      const filters = {
        ...this.assessmentRequestOptions.filter,
        and: [...this.assessmentRequestOptions.filter.and, { status: { eq: this.statusFilter } }],
      };
    } else {
      const filters = { ...this.assessmentRequestOptions.filter, and: [{ status: { eq: this.statusFilter } }] };
    }
    this.getAssessments();
    this.currentFilters = true;
  }

  public onAction({ action, context: assessment }: ActionArgs<FormattedAssessment, ActionKey>): void {
    if (
      !assessment.editableFromAssessmentList &&
      ![ActionKey.SHOW_ASSESSMENT, ActionKey.SCAN_QR_CODE].includes(action.key)
    ) {
      this.openLinkedSession();
      return;
    }

    switch (action.key) {
      case ActionKey.SHOW_ASSESSMENT:
        this.showAssessment(assessment);
        return;
      case ActionKey.COPY_ASSESSMENT_LINK:
        this.copyAssessmentLink(assessment);
        return;
      case ActionKey.ARCHIVE_ASSESSMENT:
        this.archiveAssessment(assessment);
        return;
      case ActionKey.RESTORE_ASSESSMENT:
        this.restoreAssessment(assessment);
        return;
      case ActionKey.DELETE_ASSESSMENT:
        this.deleteAssessment(assessment, false);
        return;
      case ActionKey.SCAN_QR_CODE:
        this.modalData = assessment;
        this.newUrl = new URL(this.generateAssessmentURL(assessment.uuid), window.location.origin);
        this.showModal();
        return;
    }
  }
  public onMyAssessments(): void {
    if (this.onlyMyAssessments === true) {
      localStorage.setItem('onlyMyAssessmentsPatients', 'false');
      this.onlyMyAssessments = false;
    } else {
      localStorage.setItem('onlyMyAssessmentsPatients', 'true');
      this.onlyMyAssessments = true;
    }
    this.getAssessments();
  }

  public onArchivedAssessments(): void {
    if (this.onlyArchivedAssessments === true) {
      localStorage.setItem('onlyArchivedAssessmentsPatients', 'false');
      this.onlyArchivedAssessments = false;
    } else {
      localStorage.setItem('onlyArchivedAssessmentsPatients', 'true');
      this.onlyArchivedAssessments = true;
    }
    this.getAssessments();
  }

  showModal(): void {
    this.isVisible = true;
  }

  handleOk(): void {
    this.isVisible = false;
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  navigate() {
    this.router.navigate(['/psira/case-management/create-assessment']);
  }

  public onPatientSelect(): void {
    if (!this.canManagePatientAssessments()) {
      this.modalService.warning({
        nzTitle: this.translate.instant('core.assessments'),
        nzContent: this.translate.instant('patientsManagement.onlyCaseManagersCanCreateAssessments'),
      });
      return;
    }

    const dataString = encryptRouteObject(this.patient, environment.secretKey);
    this.router.navigate(['/psira/case-management/create-assessment'], {
      queryParams: {
        profile: dataString,
      },
    });
  }

  public onAssessmentSelect(assessment: FormattedAssessment): void {
    if (!assessment.editableFromAssessmentList) {
      this.openLinkedSession();
      return;
    }
    this.openAssessmentModal(assessment);
  }

  closeAssessmentModal(): void {
    this.assessmentModalVisible = false;
    this.editingAssessment = undefined;
  }

  onAssessmentSaved(): void {
    this.closeAssessmentModal();
    this.getAssessments();
  }

  private showAssessment({ uuid }: FormattedAssessment): void {
    window.open(this.generateAssessmentURL(uuid));
  }

  private openLinkedSession(): void {
    const dataString = encryptRouteObject(this.patient, environment.secretKey);
    this.router.navigate(['/psira/case-management/profile'], {
      queryParams: {
        profile: dataString,
        tab: 'sessions',
      },
    });
  }

  private generateAssessmentURL(assesmentUuid: string): string {
    const cryptoId = encryptRoutePayload(assesmentUuid, environment.secretKey);
    const tree = this.router.createUrlTree(['/assessment/overview'], { queryParams: { assessment: cryptoId } });
    return this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
  }

  private copyAssessmentLink({ uuid }: FormattedAssessment): void {
    const url = new URL(this.generateAssessmentURL(uuid), window.location.origin);
    this.clipboardService.copy(url.toString());
    this.messageService.create('success', this.translate.instant('plannedAssessments.assessmentLinkCopied'));
  }

  private createSearchFilter(searchString: string): Array<{ [K in keyof Partial<FormattedAssessment>]: {} }> {
    if (!searchString) return [];
    return [
      {
        assessmentType: {
          or: [
            {
              name: {
                iLike: `%${searchString}%`,
              },
            },
          ],
        },
      },
      {
        patient: {
          or: [
            { firstName: { iLike: `%${searchString}%` } },
            { middleName: { iLike: `%${searchString}%` } },
            { lastName: { iLike: `%${searchString}%` } },
            { medicalRecordNo: { iLike: `%${searchString}%` } },
          ],
        },
      },
      {
        clinician: {
          or: [
            { firstName: { iLike: `%${searchString}%` } },
            { middleName: { iLike: `%${searchString}%` } },
            { lastName: { iLike: `%${searchString}%` } },
            { workID: { iLike: `%${searchString}%` } },
          ],
        },
      },
    ];
  }

  private getAssessments(): void {
    if (!this.patient?.id) return;
    this.isLoading = true;
    this.assessmentService
      .getPatientAssessments(this.patient.id, this.onlyArchivedAssessments)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (assessments: any[]) => {
          this.data = this.filterPatientAssessments(assessments).map((assessment: any) =>
            Convert.toFormattedAssessment(assessment)
          );
          this.pageInfo = {
            startCursor: '',
            endCursor: '',
            hasNextPage: false,
            hasPreviousPage: false,
          };
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('plannedAssessments.unableLoadAssessments'),
          })
      );
  }

  private filterPatientAssessments(assessments: any[]): any[] {
    return assessments.filter((assessment) => {
      if (this.onlyArchivedAssessments && !assessment.deleted) return false;
      if (this.onlyMyAssessments && !this.isResponsibleForAssessment(assessment)) return false;
      if (this.statusFilter && assessment.status !== this.statusFilter) return false;
      if (this.searchString && !this.matchesSearch(assessment, this.searchString)) return false;
      return true;
    });
  }

  private matchesSearch(assessment: any, searchString: string): boolean {
    const normalized = searchString.toLowerCase();
    return [
      assessment.assessmentType?.name,
      assessment.patient?.firstName,
      assessment.patient?.middleName,
      assessment.patient?.lastName,
      assessment.patient?.medicalRecordNo,
      assessment.clinician?.firstName,
      assessment.clinician?.middleName,
      assessment.clinician?.lastName,
      assessment.clinician?.workID,
    ]
      .filter((value) => !!value)
      .some((value) => `${value}`.toLowerCase().includes(normalized));
  }

  private openAssessmentModal(assessment: FormattedAssessment): void {
    if (!assessment.id) return;
    this.assessmentModalLoading = true;
    this.assessmentService
      .getFullAssessment(assessment.id)
      .pipe(finalize(() => (this.assessmentModalLoading = false)))
      .subscribe(
        (fullAssessment: FullAssessment) => {
          this.editingAssessment = {
            ...fullAssessment,
            patient: this.patient as any,
          };
          this.assessmentModalVisible = true;
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('patientsManagement.unableLoadAssessment'),
          })
      );
  }

  private async archiveAssessment(assessment: FormattedAssessment) {
    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: this.translate.instant('plannedAssessments.archiveAssessmentTitle'),
      nzContent: this.translate.instant('plannedAssessments.archiveAssessmentConfirm', { name: assessment.name }),
    });

    const confirmation = await modal.afterClose.toPromise();
    if (!confirmation) return;

    this.isLoading = true;
    this.assessmentService
      .archiveAssessment(assessment)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (archived) => {
          if (!archived) {
            this.getAssessments();
          } else {
            this.getAssessments();
          }
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('plannedAssessments.unableArchiveAssessment', { name: assessment.name }),
          })
      );
  }

  private async restoreAssessment(assessment: FormattedAssessment) {
    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: this.translate.instant('plannedAssessments.restoreAssessmentTitle'),
      nzContent: this.translate.instant('plannedAssessments.restoreAssessmentConfirm', { name: assessment?.name }),
    });

    const confirmation = await modal.afterClose.toPromise();
    if (!confirmation) return;

    this.isLoading = true;
    this.assessmentService
      .restoreAssessment(assessment)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (archived) => {
          if (!archived) {
            this.getAssessments();
          } else {
            this.getAssessments();
          }
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('plannedAssessments.unableRestoreAssessment', { name: assessment.name }),
          })
      );
  }

  private async deleteAssessment(assessment: FormattedAssessment, archive: boolean = true): Promise<void> {
    // create confirmation modal
    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: this.translate.instant('plannedAssessments.deleteAssessmentTitle'),
      nzContent: this.translate.instant('plannedAssessments.deleteAssessmentConfirm', { name: assessment.name }),
    });

    // wait for modal to successfully complete
    const confirmation = await modal.afterClose.toPromise();
    if (!confirmation) return;

    this.isLoading = true;
    this.assessmentService
      .deleteAssessment(assessment, archive)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (archived) => {
          if (!archived) {
            this.getAssessments();
          } else {
            this.getAssessments();
          }
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('plannedAssessments.unableDeleteAssessment', { name: assessment.name }),
          })
      );
  }

  canManagePatientAssessments(): boolean {
    const userId = this.userId;
    return !!userId && (this.patient?.caseManagers || []).some((user) => user.id === userId);
  }

  private isResponsibleForAssessment(assessment: any): boolean {
    const userId = this.userId;
    const responsibleUserIds = (assessment.responsibleUsers || []).map((user: User) => user.id);
    return assessment.clinicianId === userId || responsibleUserIds.includes(userId);
  }

  private get userId(): number {
    const user = JSON.parse(localStorage.getItem('user')) as User;
    return user.id ?? 0;
  }
}
