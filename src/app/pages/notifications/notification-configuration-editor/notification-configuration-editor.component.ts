import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartmentsService } from '@app/pages/administration/@services/departments.service';
import { EmailTemplatesService } from '@app/pages/administration/@services/email-templates.service';
import { RolesService } from '@app/pages/administration/@services/roles.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NotificationsService } from '../@services/notifications.service';
import {
  NotificationChannel,
  NotificationChannelLabel,
  NotificationConfiguration,
  NotificationEvent,
  NotificationEventDescription,
  NotificationEventLabel,
  NotificationFamily,
} from '../@types/notification';

@Component({
  selector: 'app-notification-configuration-editor',
  templateUrl: './notification-configuration-editor.component.html',
  styleUrls: ['./notification-configuration-editor.component.scss'],
})
export class NotificationConfigurationEditorComponent implements OnInit {
  configurationId?: number;
  departments: any[] = [];
  roles: any[] = [];
  templates: any[] = [];
  loading = false;
  saving = false;
  channels = Object.values(NotificationChannel);
  events = Object.values(NotificationEvent);
  channelLabel = NotificationChannelLabel;
  eventLabel = NotificationEventLabel;
  eventDescription = NotificationEventDescription;

  form = this.fb.group({
    departmentIds: [[]],
    channel: [NotificationChannel.EMAIL, Validators.required],
    family: [NotificationFamily.ASSESSMENT, Validators.required],
    event: [NotificationEvent.ASSESSMENT_ASSIGNED, Validators.required],
    recipientRoleId: [null, Validators.required],
    mailTemplateId: [null, Validators.required],
    active: [true],
    notes: [''],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private notificationsService: NotificationsService,
    private departmentsService: DepartmentsService,
    private rolesService: RolesService,
    private emailTemplatesService: EmailTemplatesService,
    private message: NzMessageService,
    private modalService: NzModalService,
    private errorService: ErrorHandlerService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') this.configurationId = Number(id);
    this.loadReferenceData();
    if (this.configurationId) this.loadConfiguration(this.configurationId);
    const duplicateFrom = Number(this.route.snapshot.queryParamMap.get('duplicateFrom'));
    if (!this.configurationId && duplicateFrom) this.loadConfiguration(duplicateFrom, true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.warning(this.translate.instant('systemMessages.requiredFields'));
      return;
    }
    const value = this.form.value;
    const departmentIds = (value.departmentIds || []).map((id: any) => Number(id)).filter((id: number) => !!id);
    const scopes: Array<number | null> = departmentIds.length ? departmentIds : [null];
    const basePayload: Partial<NotificationConfiguration> = {
      ...value,
      family: this.eventFamily(value.event),
      mailTemplateId: value.mailTemplateId || undefined,
    };
    delete (basePayload as any).departmentIds;
    const requests = scopes.map((departmentId: number | null, index: number) => {
      const payload = { ...basePayload, departmentId: departmentId || undefined };
      if (this.configurationId && index === 0) {
        return this.notificationsService.updateConfiguration({ id: this.configurationId, ...payload });
      }
      return this.notificationsService.createConfiguration(payload);
    });
    const request = requests.length ? forkJoin(requests) : of([]);

    this.saving = true;
    request.pipe(finalize(() => (this.saving = false))).subscribe(
      () => {
        this.message.success(
          this.translate.instant(this.configurationId ? 'notifications.configurationUpdated' : 'notifications.configurationsCreated')
        );
        this.router.navigate(['/psira/notifications/administration']);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to save notification configuration' })
    );
  }

  onEventChange(event: NotificationEvent): void {
    this.form.controls.family.setValue(this.eventFamily(event));
  }

  showEventDescription(event: NotificationEvent): void {
    this.modalService.info({
      nzTitle: this.eventLabel[event] || event,
      nzContent: this.eventDescription[event] || this.translate.instant('notifications.configurableNotificationType'),
      nzOkText: this.translate.instant('core.close'),
    });
  }

  eventFamily(event: NotificationEvent): NotificationFamily {
    if (event.startsWith('INFORMED_CONSENT_')) return NotificationFamily.INFORMED_CONSENT;
    if (event.startsWith('ASSESSMENT_')) return NotificationFamily.ASSESSMENT;
    if (event.startsWith('CASE_')) return NotificationFamily.CASE;
    return NotificationFamily.AUTOMATION;
  }

  private loadConfiguration(id: number, duplicate: boolean = false): void {
    this.loading = true;
    this.notificationsService
      .getConfiguration(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (configuration) =>
          this.form.patchValue({
            departmentIds: configuration.departmentId ? [configuration.departmentId] : [],
            channel: configuration.channel,
            family: configuration.family,
            event: configuration.event,
            recipientRoleId: configuration.recipientRoleId,
            mailTemplateId: configuration.mailTemplateId || null,
            active: configuration.active,
            notes: duplicate
              ? [configuration.notes, this.translate.instant('notifications.copyPendingSave')].filter(Boolean).join('\n')
              : configuration.notes || '',
          }),
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load notification configuration' })
      );
  }

  private loadReferenceData(): void {
    forkJoin({
      departments: this.departmentsService.departments({ paging: { first: 50 }, sorting: [{ field: 'name', direction: 'ASC' }] as any }),
      roles: this.rolesService.roles({ paging: { first: 50 }, sorting: [{ field: 'name', direction: 'ASC' }] as any }),
      templates: this.emailTemplatesService.getAllEmailTemplates({ paging: { first: 50 }, filter: {}, sorting: [] }),
    }).subscribe(
      ({ departments, roles, templates }: any) => {
        this.departments = departments.data.departments.edges.map((edge: any) => edge.node);
        this.roles = roles.data.roles.edges.map((edge: any) => edge.node);
        this.templates = templates.data.getAllEmailTemplates.edges.map((edge: any) => edge.node);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load notification references' })
    );
  }

  selectAllDepartments(): void {
    this.form.controls.departmentIds.setValue(this.departments.map((department) => department.id));
  }

  clearDepartments(): void {
    this.form.controls.departmentIds.setValue([]);
  }
}
