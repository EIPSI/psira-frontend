import { Component, OnInit } from '@angular/core';
import {
  Action,
  ActionArgs,
  DEFAULT_PAGE_SIZE,
  SortField,
  TableColumn,
} from '@shared/@modules/master-data/@types/list';
import { AssessmentAdministrationColumns } from '@app/pages/administration/@tables/assessment-administration.table';
import { PageInfo, Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { Sorting } from '@shared/@types/sorting';
import { AssessmentAdministrationForm } from '@app/pages/administration/@forms/assessment-administration.form';
import { finalize } from 'rxjs/operators';
import { AssessmentAdministration } from '@app/pages/administration/@types/assessment-administration';
import { AssessmentAdministrationService } from '@app/pages/administration/@services/assessment-administration.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { Convert } from '../../../@shared/classes/convert';
import { TranslateService } from '@ngx-translate/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

enum ActionKey {
  EDIT,
  DUPLICATE,
  DELETE,
}

@Component({
  selector: 'app-assessment-administration',
  templateUrl: './assessment-administration.component.html',
  styleUrls: ['./assessment-administration.component.scss'],
})
export class AssessmentAdministrationComponent implements OnInit {

  public data: Partial<AssessmentAdministration>[];
  public columns: TableColumn<Partial<AssessmentAdministration>>[] = AssessmentAdministrationColumns;
  public isLoading = false;
  public pageInfo: PageInfo;
  public actions: Action<ActionKey>[] = [];

  // form properties
  public showCreateAssessmentAdministration = false;
  public populateForm = false;
  public resetForm = false;
  public assessmentAdministration: AssessmentAdministration = { name: '', status: 'ACTIVE' as any } as AssessmentAdministration;
  public assessmentAdministrationForm = AssessmentAdministrationForm;

  public assessmentAdministrationRequestOptions: { paging: Paging; filter: Filter; sorting: Sorting[] } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
  };

  constructor(
    private assessmentAdministrationService: AssessmentAdministrationService,
    private modalService: NzModalService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.getAssessmentTypes();
    this.actions = [
      { key: ActionKey.EDIT, title: this.translate.instant('assessmentAdministration.editType') },
      { key: ActionKey.DUPLICATE, title: this.translate.instant('core.duplicate') },
      { key: ActionKey.DELETE, title: this.translate.instant('core.delete') },
    ];
  }

  public onPageChange(paging: Paging): void {
    this.assessmentAdministrationRequestOptions.paging = paging;
    this.getAssessmentTypes();
  }

  public onSort(sorting: SortField<AssessmentAdministration>[]): void {
    this.assessmentAdministrationRequestOptions.sorting = sorting;
    this.getAssessmentTypes();
  }

  public onFilter(filter: Filter): void {
    this.assessmentAdministrationRequestOptions.filter = filter;
    this.getAssessmentTypes();
  }

  public onAction({
    action,
    context: assessmentAdministration,
  }: ActionArgs<AssessmentAdministration, ActionKey>): void {
    switch (action.key) {
      case ActionKey.EDIT:
        this.openCreatePanel(assessmentAdministration);
        return;
      case ActionKey.DUPLICATE:
        this.duplicateAssessmentType(assessmentAdministration);
        return;
      case ActionKey.DELETE:
        this.deleteAssessmentType(assessmentAdministration);
        return;
    }
  }

  public openCreatePanel(assessmentAdministration?: AssessmentAdministration): void {
    if (assessmentAdministration) this.assessmentAdministration = { ...assessmentAdministration };
    else this.assessmentAdministration = { name: '', status: 'ACTIVE' as any } as AssessmentAdministration;
    this.showCreateAssessmentAdministration = true;
    this.populateForm = true;
    this.resetForm = true;
  }

  public closeCreatePanel(): void {
    this.assessmentAdministration = { name: '', status: 'ACTIVE' as any } as AssessmentAdministration;
    this.showCreateAssessmentAdministration = false;
    this.populateForm = false;
    this.resetForm = false;
  }

  public onSubmitForm(assessmentAdministration: AssessmentAdministration): void {
    this.saveAssessmentType(assessmentAdministration);
  }

  public submitAssessmentTypeDraft(): void {
    this.saveAssessmentType(this.assessmentAdministration);
  }

  private saveAssessmentType(assessmentAdministration: AssessmentAdministration): void {
    const normalizedAssessmentType = this.normalizeAssessmentType(this.extractAssessmentTypePayload(assessmentAdministration));
    if (!normalizedAssessmentType) return;

    if (this.assessmentAdministration?.id) {
      normalizedAssessmentType.id = this.assessmentAdministration.id;
      this.updateAssessmentType(normalizedAssessmentType);
    } else {
      this.createAssessmentType(normalizedAssessmentType);
    }
  }

  private duplicateAssessmentType(assessmentAdministration: AssessmentAdministration): void {
    const copy = this.normalizeAssessmentType({
      ...assessmentAdministration,
      id: undefined,
      name: this.copyName(assessmentAdministration.name),
    });

    if (copy) this.createAssessmentType(copy);
  }

  private deleteAssessmentType(assessmentAdministration: AssessmentAdministration): void {
    this.modalService.confirm({
      nzTitle: this.translate.instant('core.confirm'),
      nzContent: this.translate.instant('assessmentAdministration.deleteAssessmentTypeConfirm', {
        name: assessmentAdministration.name,
      }),
      nzOkText: this.translate.instant('core.delete'),
      nzCancelText: this.translate.instant('core.cancel'),
      nzOnOk: () => {
        this.isLoading = true;
        return this.assessmentAdministrationService
          .deleteAssessmentAdministration(assessmentAdministration)
          .pipe(finalize(() => (this.isLoading = false)))
          .toPromise()
          .then(() => {
            this.getAssessmentTypes();
            this.message.success(this.translate.instant('assessmentAdministration.assessmentTypeDeleted'));
          })
          .catch((error) => {
            this.errorService.handleError(error, {
              prefix: this.translate.instant('assessmentAdministration.unableDeleteAssessmentType'),
            });
            throw error;
          });
      },
    });
  }

  private extractAssessmentTypePayload(payload: any): AssessmentAdministration {
    return payload?.assessmentAdministration || payload?.assessmentType || payload?.data || payload;
  }

  private copyName(name: string): string {
    return `${name || ''} ${this.translate.instant('core.copySuffix')}`.trim();
  }

  private normalizeAssessmentType(assessmentAdministration: AssessmentAdministration): AssessmentAdministration | null {
    const name = assessmentAdministration?.name?.trim();
    if (!name) {
      this.errorService.handleError(new Error('Assessment type name is required'), {
        prefix: this.translate.instant('forms.assessmentAdministration.typeNameValidation'),
      });
      return null;
    }

    return {
      ...assessmentAdministration,
      name,
      status: assessmentAdministration.status,
    };
  }

  private getAssessmentTypes(): void {
    this.isLoading = true;
    this.assessmentAdministrationService
      .assessmentAdministration(this.assessmentAdministrationRequestOptions)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.data = data.assessmentTypes.edges.map((assessmentTypes: any) =>
            Convert.toAssessmentAdministration(assessmentTypes.node)
          );
          this.pageInfo = data.assessmentTypes.pageInfo;
        },
        (err) => this.errorService.handleError(err, { prefix: this.translate.instant('planAssessment.unableLoadAssessmentType') })
      );
  }

  private updateAssessmentType(assessmentAdministration: AssessmentAdministration) {
    this.assessmentAdministrationService
      .updateAssessmentAdministration(assessmentAdministration)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        ({ data }) => {
          this.isLoading = false;
          this.getAssessmentTypes();
          this.closeCreatePanel();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('assessmentAdministration.unableSaveAssessmentType') })
      );
  }

  private createAssessmentType(assessmentAdministration: AssessmentAdministration) {
    this.assessmentAdministrationService
      .createAssessmentType(assessmentAdministration)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        ({ data }) => {
          this.isLoading = false;
          this.getAssessmentTypes();
          this.closeCreatePanel();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('assessmentAdministration.unableSaveAssessmentType') })
      );
  }
}
