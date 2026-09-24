import { Filter } from '@shared/@types/filter';
import { Convert } from '@shared/classes/convert';
import { Component } from '@angular/core';
import { QuestionnaireManagementService } from '../@services/questionnaire-management.service';
import { FormattedQuestionnaireVersion, QuestionnaireStatus } from '../@types/questionnaire';
import {
  TableColumn,
  Action,
  ActionArgs,
  DEFAULT_PAGE_SIZE,
  SortField,
} from '@shared/@modules/master-data/@types/list';
import { PermissionKey } from '@shared/@types/permission';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { QuestionnaireColumns } from '../@tables/questionnaire.table';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { NzModalService } from 'ng-zorro-antd/modal';
import { finalize } from 'rxjs/operators';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { PageInfo, Paging } from '@shared/@types/paging';
import { Sorting } from '@shared/@types/sorting';
import { QuestionnaireVersion } from '@app/pages/questionnaire-management/@types/questionnaire';
import { TranslateService } from '@ngx-translate/core';
import { DepartmentsService } from '@app/pages/patients-management/@services/departments.service';
import { encryptRouteObject, encryptRoutePayload, decryptRoutePayload } from '@app/@shared/utils/route-crypto.util';


enum ActionKey {
  ARCHIVE_QUESTIONNAIRE,
  // DELETE_QUESTIONNAIRE,
}

// TODO: implement keyword search
// https://github.com/doug-martin/nestjs-query/issues/1015
export const createSearchFilter = (searchString: string): Array<{ [K in keyof Partial<QuestionnaireVersion>]: {} }> => {
  if (!searchString) return [];
  return [
    { name: { iLike: `%${searchString}%` } },
    // {
    //   questionnaire: {
    //     or: [{ abbreviation: { iLike: `%${searchString}%` } }, { language: { iLike: `%${searchString}%` } }],
    //   },
    // },
  ];
};

@Component({
  selector: 'app-questionnaire-list',
  templateUrl: './questionnaire-list.component.html',
  styleUrls: ['./questionnaire-list.component.scss'],
})
export class QuestionnaireListComponent {
  public PK = PermissionKey;

  public data: FormattedQuestionnaireVersion[];

  public columns: TableColumn<FormattedQuestionnaireVersion>[] = QuestionnaireColumns;

  public actions: Action<ActionKey>[] = [];

  public loading = false;

  public pageInfo: PageInfo;
  public listOfDepartments: any[] = [];

  public questionnaireRequestOptions: { paging: Paging; filter: Filter; sorting: Sorting[] } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: { and: [{ zombie: { is: false } }] },
    sorting: [],
  };

  constructor(
    private qmService: QuestionnaireManagementService,
    public perms: AppPermissionsService,
    private router: Router,
    private modalService: NzModalService,
    private errorService: ErrorHandlerService,
    private translate: TranslateService,
    private departmentsService: DepartmentsService
  ) {
    this.getDepartments();

    if (this.perms.permissionsOnly(PermissionKey.QUESTIONNAIRES_EDIT_DEPARTMENT)) {
      this.actions.push({ key: ActionKey.ARCHIVE_QUESTIONNAIRE, title: 'questionnaires.archiveQuestionnaire' });
    }
  }

  public onSelect(questionnaire: FormattedQuestionnaireVersion): void {
    const dataString = encryptRouteObject(questionnaire, environment.secretKey);
    this.router.navigate(['/psira/questionnaire-management/questionnaire-form'], {
      queryParams: {
        questionnaire: dataString,
      },
    });
  }

  public onAction({ action, context: questionnaire }: ActionArgs<FormattedQuestionnaireVersion, ActionKey>): void {
    switch (action.key) {
      case ActionKey.ARCHIVE_QUESTIONNAIRE:
        this.archiveQuestionnaire(questionnaire);
        return;
      // case ActionKey.DELETE_QUESTIONNAIRE:
      //   this.deleteQuestionnaire(questionnaire, false);
      //   return;
    }
  }

  public onPageChange(paging: Paging): void {
    this.questionnaireRequestOptions.paging = paging;
    this.getQuestionnaires();
  }

  public onSort(sorting: SortField<FormattedQuestionnaireVersion>[]): void {
    this.questionnaireRequestOptions.sorting = sorting;
    this.getQuestionnaires();
  }

  public onFilter(filter: Filter): void {
    this.questionnaireRequestOptions.filter = filter;
    this.getQuestionnaires();
  }

  public onSearch(searchString: string): void {
    this.questionnaireRequestOptions.filter = { or: createSearchFilter(searchString) };
    this.getQuestionnaires();
  }

  private getQuestionnaires(): void {
    this.loading = true;
    this.qmService
      .getQuestionnaires(this.questionnaireRequestOptions)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(({ edges, pageInfo }) => {
        this.pageInfo = pageInfo;
        this.data = edges.map((e) => this.formatQuestionnaire(Convert.toFormattedQuestionnaireVersion(e.node)));
      });
  }

  private getDepartments(): void {
    this.loadDepartmentsPage();
  }

  private loadDepartmentsPage(after?: string, accumulatedDepartments: any[] = []): void {
    this.departmentsService
      .departments({ paging: { first: 50, after }, filter: {}, sorting: [] })
      .subscribe(
        ({ data }: any) => {
          const departments = data.departments.edges.map((department: any) =>
            Convert.toDepartment(department.node)
          );
          const allDepartments = [...accumulatedDepartments, ...departments];
          this.listOfDepartments = allDepartments;

          if (data.departments.pageInfo?.hasNextPage) {
            this.loadDepartmentsPage(data.departments.pageInfo.endCursor, allDepartments);
            return;
          }

          this.getQuestionnaires();
        },
        () => this.getQuestionnaires()
      );
  }

  private formatQuestionnaire(questionnaire: FormattedQuestionnaireVersion): FormattedQuestionnaireVersion {
    return {
      ...questionnaire,
      departmentNames: this.departmentNames(questionnaire.departmentIds),
    };
  }

  private departmentNames(departmentIds: number[] = []): string {
    return departmentIds
      .map((departmentId) =>
        this.listOfDepartments.find((department: any) => Number(department.id) === Number(departmentId))?.name
      )
      .filter(Boolean)
      .join(', ');
  }

  private async archiveQuestionnaire(questionnaire: FormattedQuestionnaireVersion): Promise<void> {
    let title = '';
    let content = '';
    let continueButton = '';
    let cancelButton = '';

    this.translate.get('questionnaires.archivedTitle').subscribe((translation) => title = translation);
    this.translate.get('questionnaires.archivedMessage').subscribe((translation) => content = translation);
    this.translate.get('questionnaires.continueButton').subscribe((translation) => continueButton = translation);
    this.translate.get('questionnaires.cancelButton').subscribe((translation) => cancelButton = translation);

    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: title,
      nzContent: content,
      nzClosable: false,
      nzOkText: continueButton,
      nzCancelText: cancelButton
    });

    const confirmation = await modal.afterClose.toPromise();
    if (!confirmation) return;

    this.loading = true;
    this.qmService
      .updateQuestionnaire(questionnaire._id, {
        name: questionnaire.name,
        language: questionnaire.language,
        timeToComplete: questionnaire.timeToComplete,
        license: questionnaire.license,
        copyright: questionnaire.copyright,
        website: questionnaire.website,
        description: questionnaire.description,
        status: QuestionnaireStatus.ARCHIVED,
        keywords: questionnaire.keywords || [],
        departmentIds: questionnaire.departmentIds || [],
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => this.getQuestionnaires(),
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('questionnaires.unableArchiveQuestionnaire', { name: questionnaire.name }),
          })
      );
  }
}
