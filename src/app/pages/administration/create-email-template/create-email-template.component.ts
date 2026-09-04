import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { EmailTemplatesService } from '../@services/email-templates.service';
import { switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { DepartmentsService } from '@app/pages/patients-management/@services/departments.service';
import { Filter } from '@app/@shared/@types/filter';
import { Paging } from '@app/@shared/@types/paging';
import { Sorting } from '@app/@shared/@types/sorting';
import { Convert } from '@app/@shared/classes/convert';
import { ErrorHandlerService } from '@app/@shared/services/error-handler.service';
import { NotificationsService } from '@app/pages/notifications/@services/notifications.service';
import { NotificationTemplateShortcut } from '@app/pages/notifications/@types/notification';

@Component({
  selector: 'app-create-email-template',
  templateUrl: './create-email-template.component.html',
  styleUrls: ['./create-email-template.component.scss']
})
export class CreateEmailTemplateComponent implements OnInit {

  selectedId: number = null;
  emailTemplate: any;
  checked: false;
  listOfDepartments: any[] = [];
  public departmentsRequestOptions: { paging: Paging; filter: Filter; sorting: Sorting[] } = {
    paging: { first: 50 },
    filter: {},
    sorting: [],
  };
  selectedDepartments: number[] = [];
  customStyles = {height: '250px', width: '100%'}
  isUpdateMode = false;
  allDepartments = false;
  editorConfig: AngularEditorConfig = {
    minHeight: '200px',
    editable: true,
    sanitize: false
  }
  shortcutsVisible = false;
  previewVisible = false;
  templateShortcuts: NotificationTemplateShortcut[] = [];
  shortcutGroups: string[] = [];
  emailForm = this.fb.group({
    name: '',
    subject: '',
    senderName: '',
    body: `<div><span style="background-color: transparent; font-size: 1rem;">Greetings!</span><br></div>
    <div>PSIRA is sending you an assessment.&nbsp;<br></div>
    <div><span style="background-color: transparent; font-size: 1rem;">Please click the link below to start the assessment!&nbsp;</span><br></div>
    <div><br></div>
    <a href="{{link}}" style="background-color:#007BFF; color: #fff; display: inline-block; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Go to assessment</a>
    <div><br></div>
    <div><span style="background-color: transparent; font-size: 1rem;">If the button does not work, you can also copy this url to your browser to start the assessment.&nbsp;</span><br></div>
    <div><br></div>
    <div>{{link}}<br></div>`,
    status: '',
    purpose: 'NOTIFICATION',
    isPublic: false,
    departmentIds: []
  });

  constructor(
     private emailTemplatesService: EmailTemplatesService,
     private fb: FormBuilder, 
     private nzMessage: NzMessageService, 
     private router: Router, 
     private route: ActivatedRoute,
     private translate: TranslateService,
     private departmentsService: DepartmentsService,
     private errorService: ErrorHandlerService,
     private notificationsService: NotificationsService,
     private clipboard: Clipboard,
  ) { }

  ngOnInit(): void {
    this.getDepartments();
    this.loadTemplateShortcuts();
    this.route.params.subscribe((data) => {
      if(data.id){
        this.isUpdateMode = true;
        this.route.paramMap.pipe(
          switchMap((params) => {
            this.selectedId = Number(params.get('id'));
            return this.emailTemplatesService.getOneEmailTemplate(this.selectedId);
          })
          // tslint:disable
        ).subscribe((data: any) => {
          this.emailTemplate = data.data.getEmailTemplate;
          this.emailForm.controls['name'].setValue(this.emailTemplate?.name);
          this.emailForm.controls['subject'].setValue(this.emailTemplate?.subject);
          this.emailForm.controls['senderName'].setValue(this.emailTemplate?.senderName || '');
          this.emailForm.controls['body'].setValue(this.emailTemplate?.body);
          this.emailForm.controls['status'].setValue(this.emailTemplate?.status);
          this.emailForm.controls['purpose'].setValue(this.emailTemplate?.purpose || 'NOTIFICATION');
          this.emailForm.controls['isPublic'].setValue(this.emailTemplate?.isPublic);
          this.allDepartments = this.emailTemplate?.isPublic;
          this.selectedDepartments = this.filterAllowedDepartmentIds(
            this.emailTemplate?.departments.map((dep: any) => dep.id) || []
          );
          this.emailForm.controls['departmentIds'].setValue(this.selectedDepartments);
        });
      }
    });
  }

  getDepartments(after?: string, accumulatedDepartments: any[] = []): void {
    this.departmentsService
      .departments({
        ...this.departmentsRequestOptions,
        paging: { first: 50, after },
      })
      .subscribe(
        ({ data }: any) => {
          const departments = data.departments.edges
            .map((department: any) => Convert.toDepartment(department.node));
          const allDepartments = [...accumulatedDepartments, ...departments];
          this.listOfDepartments = this.filterAllowedDepartments(allDepartments);
          this.selectedDepartments = this.filterAllowedDepartmentIds(this.selectedDepartments);
          this.emailForm.controls['departmentIds'].setValue(this.selectedDepartments);
          if (data.departments.pageInfo?.hasNextPage) {
            this.getDepartments(data.departments.pageInfo.endCursor, allDepartments);
          }
        },
        (err) => this.errorService.handleError(err, { prefix: 'Unable to load departments' })
      );
  }

  selectDepartments(event: number[]){
    this.selectedDepartments = event;
    this.emailForm.controls['departmentIds'].setValue(this.selectedDepartments);
  }

  selectAllDepartments(): void {
    this.selectedDepartments = this.listOfDepartments.map((department: any) => department.id);
    this.emailForm.controls['departmentIds'].setValue(this.selectedDepartments);
  }

  removeDepartments(): void {
    this.selectedDepartments = [];
    this.emailForm.controls['departmentIds'].setValue([]);
  }

  onPublicChange(isPublic: boolean): void {
    this.allDepartments = isPublic;
    if (isPublic) {
      this.removeDepartments();
    }
  }

  onFormSubmit(){
    this.emailForm.controls['departmentIds'].setValue(this.emailForm.value.isPublic ? [] : this.selectedDepartments);
    this.emailTemplatesService.createEmailTemplate(this.emailForm.value).subscribe(() => {
      this.emailForm.reset();
      const message$ = this.translate.get('emailTemplates.created').subscribe((message) => {
        this.nzMessage.success(message, { nzDuration: 3000 });
      });
      message$.unsubscribe();
      this.router.navigate(['/psira/notifications/email-templates'])
    },
    (err) => {
      this.nzMessage.error(`${err}`, { nzDuration: 3000 });
    })
  }

  onFormUpdateSubmit(){
    this.emailForm.controls['departmentIds'].setValue(this.emailForm.value.isPublic ? [] : this.selectedDepartments);
    this.emailTemplatesService.updateEmailTemplate({id: this.selectedId, ...this.emailForm.value}).subscribe(() => {
      this.emailForm.reset();
      const message$ = this.translate.get('emailTemplates.updated').subscribe((message) => {
        this.nzMessage.success(message, { nzDuration: 3000 });
      });
      message$.unsubscribe();
      this.router.navigate(['/psira/notifications/email-templates']);
    },
    (err) => {
      this.nzMessage.error(`${err}`, { nzDuration: 3000 });
    })
  }

  showShortcuts(): void {
    this.shortcutsVisible = true;
  }

  shortcutsForGroup(group: string): NotificationTemplateShortcut[] {
    return this.templateShortcuts.filter((shortcut) => shortcut.group === group);
  }

  shortcutGroupTitle(group: string): string {
    const labels: Record<string, string> = {
      user: 'Usuario',
      patient: 'Paciente',
      therapist: 'Terapeuta',
      supervisor: 'Supervisor',
      case: 'Caso',
      assessment: 'Evaluación',
      session: 'Sesión',
      consent: 'Consentimiento informado',
      system: 'Sistema',
      notification: 'Notificación',
    };
    const normalized = String(group || '').trim();
    const key = normalized.toLowerCase();
    return labels[key] || normalized
      .replace(/[_-]+/g, ' ')
      .replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
  }

  copyShortcut(token: string, event?: Event): void {
    event?.stopPropagation();
    const copied = this.clipboard.copy(token);
    copied ? this.nzMessage.success('Variable copiada') : this.nzMessage.error('No se pudo copiar la variable');
  }

  insertShortcut(token: string): void {
    const currentBody = this.emailForm.controls['body'].value || '';
    this.emailForm.controls['body'].setValue(`${currentBody} ${token}`);
  }

  showPreview(): void {
    this.previewVisible = true;
  }

  private loadTemplateShortcuts(): void {
    this.notificationsService.getTemplateShortcuts().subscribe(
      (shortcuts) => {
        this.templateShortcuts = shortcuts || [];
        this.shortcutGroups = [...new Set(this.templateShortcuts.map((shortcut) => shortcut.group))];
      },
      (err) => this.errorService.handleError(err, { prefix: 'Unable to load template shortcuts' })
    );
  }

  private filterAllowedDepartments(departments: any[]): any[] {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const canSeeAll = user?.isSuperUser ||
      user?.roles?.some((role: any) => role.isSuperAdmin || role.code === 'SUPER_ADMIN') ||
      user?.permissions?.some((permission: any) => ['users.edit.all', 'assessments.assign.all'].includes(permission.name)) ||
      user?.roles?.some((role: any) =>
        role.permissions?.some((permission: any) => ['users.edit.all', 'assessments.assign.all'].includes(permission.name))
      );
    if (canSeeAll) return departments;
    const allowedIds = (user?.departments || []).map((department: any) => Number(department.id));
    return departments.filter((department: any) => allowedIds.includes(Number(department.id)));
  }

  private filterAllowedDepartmentIds(departmentIds: number[] = []): number[] {
    const allowedIds = this.listOfDepartments.map((department: any) => Number(department.id));
    if (!allowedIds.length) return departmentIds || [];
    return (departmentIds || []).filter((departmentId) => allowedIds.includes(Number(departmentId)));
  }
}
