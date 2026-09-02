import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartmentsService } from '@app/pages/administration/@services/departments.service';
import { RolesService } from '@app/pages/administration/@services/roles.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { InformedConsentService } from '../@services/informed-consent.service';
import {
  InformedConsentManagementStatus,
  InformedConsentStatusLabel,
  InformedConsentTrigger,
  InformedConsentTriggerLabel,
} from '../@types/informed-consent';

@Component({
  selector: 'app-informed-consent-management-editor',
  templateUrl: './management-editor.component.html',
  styleUrls: ['./management-editor.component.scss'],
})
export class InformedConsentManagementEditorComponent implements OnInit {
  managementId?: number;
  loading = false;
  saving = false;
  models: any[] = [];
  departments: any[] = [];
  roles: any[] = [];
  statuses = Object.values(InformedConsentManagementStatus);
  triggers = Object.values(InformedConsentTrigger);
  statusLabel = InformedConsentStatusLabel;
  triggerLabel = InformedConsentTriggerLabel;

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    modelId: [null, Validators.required],
    status: [InformedConsentManagementStatus.DRAFT, Validators.required],
    trigger: [InformedConsentTrigger.FIRST_LOGIN, Validators.required],
    mandatory: [true],
    appliesToAllDepartments: [true],
    departmentIds: [[]],
    appliesToAllRoles: [true],
    roleIds: [[]],
    priority: [100, Validators.required],
    active: [true],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: InformedConsentService,
    private departmentsService: DepartmentsService,
    private rolesService: RolesService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') this.managementId = Number(id);
    this.loadReferences();
    if (this.managementId) this.loadManagement(this.managementId);
  }

  loadReferences(): void {
    forkJoin({
      models: this.service.getModels(),
      departments: this.departmentsService.departments({ paging: { first: 50 }, sorting: [{ field: 'name', direction: 'ASC' }] as any }),
      roles: this.rolesService.roles({ paging: { first: 50 }, sorting: [{ field: 'name', direction: 'ASC' }] as any }),
    }).subscribe(
      ({ models, departments, roles }: any) => {
        this.models = models || [];
        this.departments = departments.data.departments.edges.map((edge: any) => edge.node);
        this.roles = roles.data.roles.edges.map((edge: any) => edge.node);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load informed consent references' })
    );
  }

  loadManagement(id: number): void {
    this.loading = true;
    this.service.getManagement(id).pipe(finalize(() => (this.loading = false))).subscribe(
      (item) => this.form.patchValue({
        title: item.title,
        description: item.description || '',
        modelId: item.modelId,
        status: item.status,
        trigger: item.trigger,
        mandatory: item.mandatory,
        appliesToAllDepartments: item.appliesToAllDepartments,
        departmentIds: item.departments?.map((department) => department.id) || [],
        appliesToAllRoles: item.appliesToAllRoles,
        roleIds: item.roles?.map((role) => role.id) || [],
        priority: item.priority,
        active: item.active,
      }),
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load informed consent management' })
    );
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.warning('Completá los campos obligatorios.');
      return;
    }
    const value = this.form.value;
    const departmentIds = (value.departmentIds || []).map((id: any) => Number(id));
    const roleIds = (value.roleIds || []).map((id: any) => Number(id));
    const payload = {
      ...value,
      appliesToAllDepartments: !departmentIds.length,
      departmentIds,
      appliesToAllRoles: !roleIds.length,
      roleIds,
    };
    this.saving = true;
    const request = this.managementId
      ? this.service.updateManagement({ id: this.managementId, ...payload })
      : this.service.createManagement(payload);
    request.pipe(finalize(() => (this.saving = false))).subscribe(
      () => {
        this.message.success('Gestión guardada');
        this.router.navigate(['/psira/informed-consent/management']);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to save informed consent management' })
    );
  }

  cancel(): void {
    this.router.navigate(['/psira/informed-consent/management']);
  }

  selectAllDepartments(): void {
    this.form.controls.departmentIds.setValue(this.departments.map((department) => department.id));
  }

  clearDepartments(): void {
    this.form.controls.departmentIds.setValue([]);
  }

  selectAllRoles(): void {
    this.form.controls.roleIds.setValue(this.roles.map((role) => role.id));
  }

  clearRoles(): void {
    this.form.controls.roleIds.setValue([]);
  }
}
