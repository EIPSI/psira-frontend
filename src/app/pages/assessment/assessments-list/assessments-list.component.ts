import {Component} from '@angular/core';
import {AssessmentService} from '@app/pages/assessment/@services/assessment.service';
import {Router} from '@angular/router';
import {environment} from '@env/environment';
import {Paging} from '@shared/@types/paging';
import {Sorting} from '@shared/@types/sorting';
import {AppPermissionsService} from '@shared/services/app-permissions.service';
import {PermissionKey} from '@app/@shared/@types/permission';
import {
    TableColumn,
    Action,
    DEFAULT_PAGE_SIZE,
    SortField,
    ActionArgs
} from '../../../@shared/@modules/master-data/@types/list';
import {FormattedAssessment} from '../@types/assessment';
import {AssessmentTable} from '../@tables/assessment.table';
import {Convert} from '../../../@shared/classes/convert';
import {PageInfo} from '../../../@shared/@types/paging';
import {finalize} from 'rxjs/operators';
import {Filter} from '../../../@shared/@types/filter';
import {ErrorHandlerService} from '../../../@shared/services/error-handler.service';
import {User} from '@app/pages/user-management/@types/user';
import {NzModalService} from 'ng-zorro-antd/modal';
import {ClipboardService} from 'ngx-clipboard';
import {NzMessageService} from 'ng-zorro-antd/message';
import {LocationStrategy} from '@angular/common';
import {TranslateService} from '@ngx-translate/core';
import { encryptRouteObject, encryptRoutePayload, decryptRoutePayload } from '@app/@shared/utils/route-crypto.util';


enum ActionKey {
    SHOW_ASSESSMENT,
    COPY_ASSESSMENT_LINK,
    ARCHIVE_ASSESSMENT,
    CANCEL_SESSION,
    DELETE_ASSESSMENT,
    SENT_EMAIL,
    SCAN_QR_CODE,
    RESTORE_ASSESSMENT
}

@Component({selector: 'app-planned-assessment', templateUrl: './assessments-list.component.html', styleUrls: ['./assessments-list.component.scss']})
export class AssessmentsListComponent {
    PK = PermissionKey;
    public columns : TableColumn < FormattedAssessment > [] = AssessmentTable;
    public data : FormattedAssessment[];
    public currentFilters = false;
    public cacheFilters = JSON.parse(localStorage.getItem('filter'));
    public pageInfo : PageInfo;
    public loading = false;
    public actions : Action < ActionKey > [] = [
        {
            key: ActionKey.SHOW_ASSESSMENT,
            title: 'plannedAssessments.startSession'
        }, {
            key: ActionKey.COPY_ASSESSMENT_LINK,
            title: 'plannedAssessments.copySessionLink'
        }, {
            key: ActionKey.SCAN_QR_CODE,
            title: 'plannedAssessments.scanQrCode'
        },
    ];
    public onlyMyAssessments = (localStorage.getItem('onlyMyAssessments') === 'true');
    public onlyArchivedAssessments = (localStorage.getItem('onlyArchivedAssessments') === 'true');
    isVisible = false;
    modalData : any = '';
    statusFilter = '';

    public assessmentRequestOptions : {
        paging: Paging;
        filter: Filter;
        sorting: Sorting[]
    } = {
        paging: {
            first: DEFAULT_PAGE_SIZE
        },
        filter: {},
        sorting: []
    };
    newUrl : URL;

    // tslint:disable
    constructor(private assessmentService : AssessmentService, private router : Router, private modalService : NzModalService, private errorService : ErrorHandlerService, private clipboardService : ClipboardService, private messageService : NzMessageService, private locationStrategy : LocationStrategy, public perms : AppPermissionsService, private translate : TranslateService) {
        this.getAssessments();

        if (this.perms.permissionsOnly(PermissionKey.ASSESSMENTS_EDIT_DEPARTMENT)) {
            this.actions.push({key: ActionKey.CANCEL_SESSION, title: 'plannedAssessments.cancelSession'});
            this.actions.push({key: ActionKey.RESTORE_ASSESSMENT, title: 'plannedAssessments.restoreAssessment'});
            this.actions.push({key: ActionKey.ARCHIVE_ASSESSMENT, title: 'plannedAssessments.archiveAssessment'});
        }
        if (this.perms.permissionsOnly(PermissionKey.ASSESSMENTS_DELETE_DEPARTMENT)) {
            this.actions.push({key: ActionKey.DELETE_ASSESSMENT, title: 'plannedAssessments.deleteSession'});
        }
        if(environment.email){
            this.actions.push({key: ActionKey.SENT_EMAIL, title: 'plannedAssessments.sendEmail'});
        }

        if(!localStorage.getItem('onlyMyAssessments')){
            localStorage.setItem('onlyMyAssessments', this.onlyMyAssessments.toString());
        }
        if(!localStorage.getItem('onlyArchivedAssessments')){
            localStorage.setItem('onlyArchivedAssessments', this.onlyArchivedAssessments.toString());
        }
        // if(!localStorage.getItem('paging')){
        //     localStorage.setItem('paging', JSON.stringify(this.assessmentRequestOptions.paging));
        // }
        if(!localStorage.getItem('filter')){
            localStorage.setItem('filter', JSON.stringify(this.assessmentRequestOptions.filter));
        }
        if(!localStorage.getItem('sorting')){
            localStorage.setItem('sorting', JSON.stringify(this.assessmentRequestOptions.sorting));
        }
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

    public onPageChange(paging : Paging): void {
        this.assessmentRequestOptions.paging = paging;
        // localStorage.setItem('paging', JSON.stringify(this.assessmentRequestOptions.paging));
        this.getAssessments();
    }

    public onSort(sorting : SortField < FormattedAssessment > []): void {
        this.assessmentRequestOptions.sorting = sorting;
        this.getAssessments();
    }

    public onFilter(filter : Filter): void {
        this.assessmentRequestOptions.filter = filter;
        localStorage.setItem('filter', JSON.stringify(this.assessmentRequestOptions.filter));
        this.getAssessments();
        this.currentFilters = true;
    }

    public onSearch(searchString : string): void {
        this.assessmentRequestOptions.filter = {
            or: this.createSearchFilter(searchString)
        };
        this.getAssessments();
    }

    public onStatusSelect(): any{
        if(this.assessmentRequestOptions.filter.and) {
            const filters = {...this.assessmentRequestOptions.filter, and: [...this.assessmentRequestOptions.filter.and, {status: {eq: this.statusFilter}}]};
        } else {
            const filters = {...this.assessmentRequestOptions.filter, and: [{status: {eq: this.statusFilter}}]};
        }
        this.getAssessments();
        this.currentFilters = true;
    }

    public onAction({action, context: assessment} : ActionArgs < FormattedAssessment, ActionKey >): void {
        if (!assessment.editableFromAssessmentList && ![
            ActionKey.SHOW_ASSESSMENT,
            ActionKey.SCAN_QR_CODE,
        ].includes(action.key)) {
            this.openLinkedSession(assessment);
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
            case ActionKey.CANCEL_SESSION:
                this.deleteAssessment(assessment, true);
                return;
            case ActionKey.SENT_EMAIL:
                this.sendAssessmentEmail(assessment);
                return;        
            case ActionKey.SCAN_QR_CODE:
                this.modalData = assessment
                this.newUrl = new URL(this.generateAssessmentURL(assessment.uuid), window.location.origin);
                this.showModal()
                return;
        }
    }

    public onAssessmentSelect(assessment : FormattedAssessment): void {
        if (!assessment.editableFromAssessmentList) {
            this.openLinkedSession(assessment);
            return;
        }
        const dataString = encryptRouteObject(assessment, environment.secretKey);
        this.router.navigate(['/psira/assessments/plan-assessments'], {
            queryParams: {
                assessment: dataString
            }
        });
    }

    public onMyAssessments(): void {
        if(this.onlyMyAssessments === true){
           localStorage.setItem('onlyMyAssessments', 'false');
           this.onlyMyAssessments = false;
        }
        else{
           localStorage.setItem('onlyMyAssessments', 'true');
           this.onlyMyAssessments = true;
        }
        this.getAssessments();
    }

    public onArchivedAssessments(): void {
      if(this.onlyArchivedAssessments === true){
        localStorage.setItem('onlyArchivedAssessments', 'false');
        this.onlyArchivedAssessments = false;
      }
      else{
        localStorage.setItem('onlyArchivedAssessments', 'true');
        this.onlyArchivedAssessments = true;
      }
      this.getAssessments();
    }

    private getAssessments(): void { // copy to not modify original options
        const options = {
            ...this.assessmentRequestOptions
        };

        if(localStorage.getItem('filter')){
            options.filter = {...options.filter, ...JSON.parse(localStorage.getItem('filter'))}
        }

        if(options.sorting.length === 0){
            options.sorting.push({field: 'createdAt', direction: 'DESC'})
        }

        if(!this.onlyArchivedAssessments){
            options.filter = {
              ...options.filter,
              and: [{ deleted: {is: false} }, ...(options.filter.and ?? [])],
            };
          }  

        // apply for only my patients
        if (this.onlyMyAssessments) 
            options.filter = {
                ... options.filter,
                and: [
                    {
                        clinician: {
                            id: {
                                eq: this.userId
                            }
                        }
                    },
                    ...(options.filter.and ?? [])
                ]
            };

        // apply for archived assessments
        if (this.onlyArchivedAssessments){
            options.filter = {
                ...options.filter,
                and: [{ deleted: {is: true} }, ...(options.filter.and ?? [])],
            };
        }
        
        // apply for assessment status
        if(this.statusFilter) {
            options.filter = {...options.filter, and: [...options.filter.and, {status: {eq: this.statusFilter}}]}
        }
        this.loading = true;
        this.assessmentService.getAssessments(options).pipe(finalize(() => (this.loading = false))).subscribe(({edges, pageInfo}) => {
            this.data = edges.map((e : any) => Convert.toFormattedAssessment(e.node));
            this.pageInfo = pageInfo;
        }, (error) => this.errorService.handleError(error, {prefix: this.translate.instant('plannedAssessments.unableLoadAssessments')}));
    }

    private async deleteAssessment(assessment : FormattedAssessment, statusCancel : boolean): Promise < void > { // create confirmation modal
        const modal = this.modalService.confirm(
            {
                nzOnOk: () => true,
                nzTitle: this.translate.instant('plannedAssessments.deleteAssessmentTitle'),
                nzContent: this.translate.instant('plannedAssessments.deleteAssessmentConfirm', {name: assessment.name})
            }
        );

        // wait for modal to successfully complete
        const confirmation = await modal.afterClose.toPromise();
        if (! confirmation) 
            return;
        

        this.loading = true;
        this.assessmentService.deleteAssessment(assessment, statusCancel).pipe(finalize(() => (this.loading = false))).subscribe((archived) => {
            if (!archived) {
                this.getAssessments();
            } else {
                this.getAssessments();
            }
        }, (error) => this.errorService.handleError(error, {prefix: this.translate.instant('plannedAssessments.unableDeleteAssessment', {name: assessment.name})}));
    }

    private async archiveAssessment(assessment : FormattedAssessment) {
        const modal = this.modalService.confirm({
            nzOnOk: () => true,
            nzTitle: this.translate.instant('plannedAssessments.archiveAssessmentTitle'),
            nzContent: this.translate.instant('plannedAssessments.archiveAssessmentConfirm', {name: assessment.name})
        });

        const confirmation = await modal.afterClose.toPromise();
        if (! confirmation) 
            return;
        

        this.loading = true;
        this.assessmentService.archiveAssessment(assessment).pipe(finalize(() => (this.loading = false))).subscribe((archived) => {
            if (!archived) {
                this.getAssessments();
            } else {
                this.getAssessments();
            }
        }, (error) => this.errorService.handleError(error, {prefix: this.translate.instant('plannedAssessments.unableArchiveAssessment', {name: assessment.name})}));
    }

    private async restoreAssessment(assessment : FormattedAssessment) {
        const modal = this.modalService.confirm({
            nzOnOk: () => true,
            nzTitle: this.translate.instant('plannedAssessments.restoreAssessmentTitle'),
            nzContent: this.translate.instant('plannedAssessments.restoreAssessmentConfirm', {name: assessment?.name})
        });

        const confirmation = await modal.afterClose.toPromise();
        if (! confirmation) 
            return;
        

        this.loading = true;
        this.assessmentService.restoreAssessment(assessment).pipe(finalize(() => (this.loading = false))).subscribe((archived) => {
            if (!archived) {
                this.getAssessments();
            } else {
                this.getAssessments();
            }
        }, (error) => this.errorService.handleError(error, {prefix: this.translate.instant('plannedAssessments.unableRestoreAssessment', {name: assessment.name})}));
    }

    private async sendAssessmentEmail(assessment : FormattedAssessment) {
        const modal = this.modalService.confirm({
            nzOnOk: () => true,
            nzTitle: this.translate.instant('plannedAssessments.sendAssessmentEmailTitle'),
            nzContent: this.translate.instant('plannedAssessments.sendAssessmentEmailConfirm')
        });

        const confirmation = await modal.afterClose.toPromise();
        if (! confirmation) 
            return;
        

        this.loading = true;
        this.assessmentService.sendAssessmentEmail(assessment).pipe(finalize(() => (this.loading = false))).subscribe((archived) => {
            if (!archived) {
                this.getAssessments();
            } else {
                this.getAssessments();
            }
        }, (error) => this.errorService.handleError(error, {prefix: this.translate.instant('plannedAssessments.unableSendEmail')}));
    }


    private createSearchFilter(searchString : string): Array < {
        [K in keyof Partial < FormattedAssessment >]: {}
    } > {
        return [
            {
                assessmentType: {
                    or: [
                        {
                            name: {
                                iLike: `%${searchString}%`
                            }
                        }
                    ]
                }
            }, {
                patient: {
                    or: [
                        {
                            firstName: {
                                iLike: `%${searchString}%`
                            }
                        }, {
                            middleName: {
                                iLike: `%${searchString}%`
                            }
                        }, {
                            lastName: {
                                iLike: `%${searchString}%`
                            }
                        }, {
                            medicalRecordNo: {
                                iLike: `%${searchString}%`
                            }
                        },
                    ]
                }
            }, {
                clinician: {
                    or: [
                        {
                            firstName: {
                                iLike: `%${searchString}%`
                            }
                        }, {
                            middleName: {
                                iLike: `%${searchString}%`
                            }
                        }, {
                            lastName: {
                                iLike: `%${searchString}%`
                            }
                        }, {
                            workID: {
                                iLike: `%${searchString}%`
                            }
                        },
                    ]
                }
            },
        ];
    }

    private showAssessment({uuid} : FormattedAssessment): void {
        window.open(this.generateAssessmentURL(uuid));
    }

    private showLinkedSessionNotice(assessment: FormattedAssessment): void {
        this.modalService.info({
            nzTitle: this.translate.instant('plannedAssessments.linkedSessionAssessmentTitle'),
            nzContent: this.translate.instant('plannedAssessments.linkedSessionAssessmentMessage', {
                session: assessment.linkedSessionLabel || assessment.clinicalSessionId || ''
            }),
        });
    }

    private openLinkedSession(assessment: FormattedAssessment): void {
        if (!assessment.patient) {
            this.showLinkedSessionNotice(assessment);
            return;
        }

        const dataString = encryptRouteObject(assessment.patient, environment.secretKey);
        this.router.navigate(['/psira/case-management/profile'], {
            queryParams: {
                profile: dataString,
                tab: 'sessions',
            },
        });
    }

    private copyAssessmentLink({uuid} : FormattedAssessment): void {
        const url = new URL(this.generateAssessmentURL(uuid), window.location.origin);
        this.clipboardService.copy(url.toString());
        this.messageService.create('success', this.translate.instant('plannedAssessments.assessmentLinkCopied'));
    }

    private generateAssessmentURL(assesmentUuid : string): string {
        const cryptoId = encryptRoutePayload(assesmentUuid, environment.secretKey);
        const tree = this.router.createUrlTree(['/assessment/overview'], {
            queryParams: {
                assessment: cryptoId
            }
        });
        return this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
    }

    private get userId(): number {
        const user = JSON.parse(localStorage.getItem('user'))as User;
        return user.id ?? 0;
    }
}
