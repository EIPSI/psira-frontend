import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateOneReportInput,
  CreateReportInput,
  Reports,
  ShinyApp,
  UpdateOneReportInput,
  UpdateReport,
} from '@app/pages/administration/@types/reports';
import { FormBuilder } from '@angular/forms';
import { Role } from '@app/pages/administration/@types/role';
import { finalize } from 'rxjs/operators';
import { RolesService } from '@app/pages/administration/@services/roles.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ReportsService } from '@app/pages/administration/@services/reports.service';
import { environment } from '@env/environment';
import { Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { Sorting } from '@shared/@types/sorting';
import { Convert } from '@shared/classes/convert';
import { ReportForm } from '@app/pages/administration/@forms/report.form';
import { Field } from '@shared/components/form/@types/field';
import { TranslateService } from '@ngx-translate/core';
import { encryptRoutePayload, decryptRoutePayload } from '@app/@shared/utils/route-crypto.util';


@Component({
  selector: 'app-create-report',
  templateUrl: './create-report.component.html',
  styleUrls: ['./create-report.component.scss'],
})
export class CreateReportComponent implements OnInit {
  roles: Role[] = [];
  selectedRoles: Role[] = [];
  shinyApps: ShinyApp[] = [];
  report: Reports;
  reportForm = JSON.parse(JSON.stringify(ReportForm));
  inputMode = true;
  isLoading = false;
  showCancelButton = false;
  populateForm = false;
  resetForm = false;
  loadingMessage = '';
  public editMode = true;
  newMode = false;
  selectedResource = '';
  selectedAppName = '';
  resourceTouched = false;
  appNameTouched = false;
  resourceOptions: Field['options'] = [];
  appOptions: Field['options'] = [];
  reportDraft: CreateReportInput = {
    id: null,
    name: '',
    resources: '',
    description: '',
    appName: '',
    repositoryLink: null,
    status: false,
    roles: [],
  };

  constructor(
    private formBuilder: FormBuilder,
    private rolesService: RolesService,
    private errorService: ErrorHandlerService,
    private message: NzMessageService,
    private reportsService: ReportsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.configureResourceField();
    this.getReportFromUrl();
    this.getRoles();
    this.getAvailableShinyApps();
    if(this.report){
      this.selectedRoles = this.report?.roles?.filter((role) => this.reportHasRole(role.id));
    }
  }

  goBack() {
    this.router.navigate(['/psira/administration/reports']);
  }

  reportHasRole(roleId: number): boolean {
    const roles = this.report?.roles?.filter((role) => role.id === roleId);
    return roles?.length > 0;
  }

  roleIsSelected(roleId: number): boolean {
    return this.selectedRoles?.some((role) => role.id === roleId) || this.reportHasRole(roleId);
  }

  assignRoleToReport(role: Role, checked: boolean) {
    if (checked && !this.selectedRoles?.some((item) => item.id === role.id)) {
      this.selectedRoles?.push(role);
    } 
    else if (!checked) {
      this.selectedRoles = this.selectedRoles?.filter((item) => item.id !== role.id);
    }
  }

  public submitForm(reportData: CreateReportInput): void {
    reportData.repositoryLink = reportData.repositoryLink || null;
    reportData.url = this.getUrlForApp(reportData.appName) || reportData.url;
    reportData.resources = this.selectedResource || reportData.resources || (this.getField('resources')?.value as string);
    reportData.appName = reportData.appName || (this.getField('appName')?.value as string);

    if (!this.validateRequiredReportFields(reportData)) {
      return;
    }

    if (!this.selectedRoles?.length) {
      this.message.warning(this.translate.instant('reports.rolesRequiredValidation'));
      return;
    }

    if (this.report) {
      reportData.id = this.report.id;
      this.updateReport(reportData);
    } else {
      this.createReport(reportData);
    }
  }

  public submitReport(): void {
    const reportData: CreateReportInput = {
      ...this.reportDraft,
      resources: this.selectedResource,
      appName: this.selectedAppName,
      repositoryLink: this.reportDraft.repositoryLink || null,
      url: this.getUrlForApp(this.selectedAppName),
    };

    if (!this.validateRequiredReportFields(reportData)) {
      return;
    }

    if (!this.selectedRoles?.length) {
      this.message.warning(this.translate.instant('reports.rolesRequiredValidation'));
      return;
    }

    if (this.report) {
      reportData.id = this.report.id;
      this.updateReport(reportData);
    } else {
      this.createReport(reportData);
    }
  }

  handleReportInputChange({ name, value }: { name: string; value: string }) {
    const field = this.getField(name);
    if (field) field.value = value;
    return;
  }

  handleResourceChange(value: string): void {
    this.selectedResource = value;
    this.resourceTouched = true;
    this.reportDraft.resources = value;
  }

  handleAppNameChange(value: string): void {
    this.selectedAppName = value;
    this.appNameTouched = true;
    this.reportDraft.appName = value;
  }

  getReportFromUrl(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.resetForm = false;
      this.populateForm = false;
      if (params.report) {
        this.inputMode = false;
        this.showCancelButton = true;
        const bytes = decryptRoutePayload(params.report, environment.secretKey);
        const decryptedData = JSON.parse(bytes);
        this.report = decryptedData;
        this.reportDraft = {
          ...decryptedData,
          repositoryLink: decryptedData?.repositoryLink || null,
        };
        this.selectedResource = decryptedData?.resources || '';
        this.selectedAppName = decryptedData?.appName || '';
        this.populateForm = true;
      } else {
        this.inputMode = true;
        this.showCancelButton = false;
        this.report = null;
        this.reportDraft = {
          id: null,
          name: '',
          resources: '',
          description: '',
          appName: '',
          repositoryLink: null,
          status: false,
          roles: [],
        };
        this.selectedResource = '';
        this.selectedAppName = '';
        this.resourceTouched = false;
        this.appNameTouched = false;
        this.resetForm = true;
      }
    });
  }

  // addRolesToReport(selectedRoles: Role[]) {
  //   setTimeout(() => {
  //     console.log('here');
  //     const rolesID = selectedRoles.map((item) => item.id);
  //     this.reportsService.addRolesToReport(this.report.id, rolesID).subscribe(
  //       ({ data }) => {
  //         this.afterCreate();
  //       },
  //       (error) =>
  //         this.errorService.handleError(error, {
  //           prefix: 'Unable to create report',
  //         })
  //     );
  //   }, 200);
  //   console.log('Last check!');
  // }

  createReport(formData: CreateReportInput) {
    this.isLoading = true;
    this.populateForm = false;
    this.resetForm = false;
    const inputData: CreateReportInput = Object.assign({}, formData);
    delete inputData.id;
    const roles = this.selectedRoles?.map((item) => item.id);
    const reportInput: CreateOneReportInput = {
      report: { ...inputData, roles },
    };
    this.loadingMessage = this.translate.instant('reports.creatingReport', { name: inputData.name });
    this.reportsService
      .createReport(reportInput)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loadingMessage = '';
        })
      )
      .subscribe(
        ({ data }) => {
          this.message.create('success', this.translate.instant('reports.reportCreated'));
          this.report = data.createOneReport;
          console.log(this.report);
          if (this.selectedRoles.length > 0) {
            console.log(this.selectedRoles);
          }
          this.afterCreate();
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('reports.unableCreateReport'),
          })
      );
  }

  updateReport(reportUpdates: UpdateReport) {
    delete reportUpdates.id;
    const roles = this.selectedRoles.map((item) => item.id);
    const reportInput: UpdateOneReportInput = {
      id: this.report.id,
      update: { ...reportUpdates, roles },
    };
    this.isLoading = true;
    this.populateForm = false;
    this.resetForm = false;
    this.loadingMessage = this.translate.instant('reports.updatingReport', { name: reportUpdates.name });
    this.reportsService
      .updateReport(reportInput)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loadingMessage = '';
        })
      )
      .subscribe(
        async ({ data }) => {
          this.message.create('success', this.translate.instant('reports.reportUpdated'));
          this.report = data.updateOneReport;
          console.log(this.report);
          if (this.selectedRoles.length > 0) {
            console.log(this.selectedRoles);
          }
          this.goBack();
        },
        (error) => {
          this.populateForm = true;
          this.errorService.handleError(error, { 
            prefix: this.translate.instant('reports.unableUpdateReport', { name: reportUpdates.name }),
          });
        }
      );
  }

  afterCreate() {
    this.populateForm = false;
    this.resetForm = true;
    const dataString = encryptRoutePayload(JSON.stringify(this.report), environment.secretKey);
    this.router.navigate(['/psira/administration/create-report'], {
      state: {
        title: this.report.name,
      },
      queryParams: {
        report: dataString,
      },
    });
    this.newMode = false;
  }

  getRoles(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting }) {
    const options: any = [];
    this.roles = [];
    this.rolesService.roles(params).subscribe(
      ({ data }: any) => {
        data.roles.edges.map((role: any) => {
          const _role = Convert.toRole(role.node);
          this.roles.push(_role);
          options.push({ label: _role.name, value: _role.id });
        });
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('roles.unableLoadRoles') })
    );
  }

  getAvailableShinyApps() {
    this.reportsService.availableShinyApps().subscribe(
      ({ data }: any) => {
        this.shinyApps = data.availableShinyApps;
        this.setFieldOptions(
          'appName',
          this.shinyApps.map((app) => ({
            label: app.title,
            value: app.appName,
          }))
        );
        this.appOptions = this.shinyApps.map((app) => ({
          label: app.title,
          value: app.appName,
        }));

      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('reports.unableLoadShinyApps') })
    );
  }

  private getUrlForApp(appName?: string): string {
    if (!appName) return '';
    return this.shinyApps.find((app) => app.appName === appName)?.url || `/shiny/${appName}`;
  }

  private validateRequiredReportFields(reportData: CreateReportInput): boolean {
    const requiredFields = [
      { name: 'name', message: 'forms.createReportForm.reportNameValidation' },
      { name: 'resources', message: 'forms.createReportForm.resourcesValidation' },
      { name: 'description', message: 'forms.createReportForm.descriptionValidation' },
      { name: 'appName', message: 'forms.createReportForm.appNameValidation' },
    ];

    const missingField = requiredFields.find((field) => this.isBlank((reportData as any)[field.name]));
    if (missingField) {
      if (missingField.name === 'resources') this.resourceTouched = true;
      if (missingField.name === 'appName') this.appNameTouched = true;
      this.message.warning(this.translate.instant(missingField.message));
      return false;
    }

    return true;
  }

  private isBlank(value: any): boolean {
    return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
  }

  private configureResourceField(): void {
    const field = this.getField('resources');
    if (!field) return;

    this.resourceOptions = field.options || [];
    field.hidden = true;
  }

  private setFieldOptions(name: string, options: Field['options']) {
    const field = this.getField(name);
    if (field) field.options = options;
  }

  private setFieldValue(name: string, value: Field['value']) {
    const field = this.getField(name);
    if (field) field.value = value;
  }

  private getField(name: string): Field | undefined {
    for (const group of this.reportForm.groups) {
      const field = group.fields.find((item: Field) => item.name === name);
      if (field) return field;
    }
  }
}
