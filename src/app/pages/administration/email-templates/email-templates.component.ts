import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Action, ActionArgs, SortField, TableColumn, DEFAULT_PAGE_SIZE } from '@app/@shared/@modules/master-data/@types/list';
import { Filter } from '@app/@shared/@types/filter';
import { PageInfo, Paging } from '@app/@shared/@types/paging';
import { Sorting } from '@app/@shared/@types/sorting';
import { Convert } from '@app/@shared/classes/convert';
import { ErrorHandlerService } from '@app/@shared/services/error-handler.service';
import { TranslateService } from '@ngx-translate/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs/operators';
import { EmailTemplatesService } from '../@services/email-templates.service';
import { EmailTemplatesColumns } from '../@tables/email-templates.table';

enum ActionKey {
  EDIT,
  DUPLICATE,
  DELETE,
}

@Component({
  selector: 'app-email-templates',
  templateUrl: './email-templates.component.html',
  styleUrls: ['./email-templates.component.scss']
})
export class EmailTemplatesComponent implements OnInit {

  public data: Partial<any>[] | any;
  public columns: TableColumn<Partial<any>>[] = EmailTemplatesColumns;
  public isLoading = false;
  public pageInfo: PageInfo;
  public actions: Action<ActionKey>[] | any = [];

  // form properties
  public showCreateAssessmentAdministration = false;
  public populateForm = false;
  public resetForm = false;

  public emailTemplatesRequestOptions: { paging: Paging; filter: Filter; sorting: Sorting[] } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
  };

  constructor(
    private emailTemplatesService: EmailTemplatesService,
    private errorService: ErrorHandlerService,
    private nzMessage: NzMessageService, 
    private modalService: NzModalService,
    private router: Router,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.getEmailTemplates();
    this.actions = [
      { key: ActionKey.EDIT, title: this.translate.instant('core.edit') },
      { key: ActionKey.DUPLICATE, title: this.translate.instant('core.duplicate') },
      { key: ActionKey.DELETE, title: this.translate.instant('core.delete') },
    ];
  }

  public onPageChange(paging: Paging): void {
    this.emailTemplatesRequestOptions.paging = paging;
    this.getEmailTemplates();
  }

  public onSort(sorting: SortField<any>[]): void {
    this.emailTemplatesRequestOptions.sorting = sorting;
  }

  public onFilter(filter: Filter): void {
    this.emailTemplatesRequestOptions.filter = filter;
    this.getEmailTemplates();
  }

  private getEmailTemplates(): void{
    this.isLoading = true;
    this.emailTemplatesService
    .getAllEmailTemplates(this.emailTemplatesRequestOptions)
    .pipe(finalize(() => (this.isLoading = false)))
    // tslint:disable
    .subscribe((x: any) => { this.data = x.data.getAllEmailTemplates.edges.map((x: any) =>
      this.formatEmailTemplate(x.node));
      this.pageInfo = x.data.getAllEmailTemplates.pageInfo;
      const message$ = this.translate.get('emailTemplates.unableToLoad').subscribe((message) => {
        (err: any) => this.errorService.handleError(err, { prefix: message })
      });
      message$.unsubscribe();
    });
  }

  deleteEmailTemplate(template: any): void {
    this.modalService.confirm({
      nzTitle: this.translate.instant('emailTemplates.deleteTemplate'),
      nzContent: this.translate.instant('emailTemplates.deleteTemplateConfirm', { name: template.name }),
      nzOkText: this.translate.instant('core.delete'),
      nzOkDanger: true,
      nzOnOk: () => this.emailTemplatesService.deleteEmailTemplate(template.id).subscribe(() => {
      const message$ = this.translate.get('emailTemplates.deleted').subscribe((message) => {
        this.nzMessage.success(message, { nzDuration: 3000 });
      });
      message$.unsubscribe();
      this.getEmailTemplates();
      }),
    });
  }

  duplicateEmailTemplate(template: any): void {
    const departmentIds = template.isPublic ? [] : (template.departments || []).map((department: any) => Number(department.id));
    this.emailTemplatesService.createEmailTemplate({
      name: `${template.name} (${this.translate.instant('core.copySuffix')})`,
      subject: template.subject,
      senderName: template.senderName,
      body: template.body,
      status: template.status,
      purpose: template.purpose || 'NOTIFICATION',
      isPublic: template.isPublic,
      departmentIds,
    }).subscribe(
      () => {
        this.nzMessage.success(this.translate.instant('emailTemplates.duplicated'), { nzDuration: 3000 });
        this.getEmailTemplates();
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('emailTemplates.unableDuplicateTemplate') })
    );
  }

  public onAction({
    action,
    context: assessmentAdministration,
  }: ActionArgs<any, ActionKey>): void {
    switch (action.key) {
      case ActionKey.EDIT:
      this.router.navigate([`/psira/notifications/email-templates/${assessmentAdministration.id}`])
        return;
      case ActionKey.DUPLICATE:
        this.duplicateEmailTemplate(assessmentAdministration);
        return;
      case ActionKey.DELETE:
        this.deleteEmailTemplate(assessmentAdministration);
        return;
    }
  }

  private formatEmailTemplate(template: any): any {
    return {
      ...Convert.toAssessmentAdministration(template),
      ...template,
      departmentNames: template.isPublic || !template.departments?.length
        ? this.translate.instant('emailTemplates.allDepartments')
        : template.departments.map((department: any) => department.name || department.id).join(', '),
    };
  }
}
