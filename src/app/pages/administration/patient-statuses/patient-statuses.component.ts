import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientStatus } from '@app/pages/patients-management/@types/patient-status';
import { Paging } from '@shared/@types/paging';
import { PatientStatusesTable } from '@app/pages/administration/@tables/patient-statuses.table';
import { PatientStatusForm } from '@app/pages/administration/@forms/patient-status.form';
import { PatientStatusesService } from '@app/pages/patients-management/@services/patient-statuses.service';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { PatientStatusModel } from '@app/pages/administration/settings/@models/patient-status.model';
import { Filter } from '@shared/@types/filter';
import { Sorting } from '@shared/@types/sorting';
import { PermissionKey } from '@shared/@types/permission';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { finalize } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TranslateService } from '@ngx-translate/core';
import { FieldGroup } from '../../../@shared/components/form/@types/field.group';
import { Field } from '../../../@shared/components/form/@types/field';

@Component({
  selector: 'app-patient-statuses',
  templateUrl: './patient-statuses.component.html',
  styleUrls: ['./patient-statuses.component.scss'],
})
export class PatientStatusesComponent implements OnInit {
  PK = PermissionKey;
  isLoading = false;
  modalLoading = false;
  patientStatuses: PatientStatus[] = [];
  paging: Paging = {
    first: 10,
  };
  pageInfo: any;
  patientStatusesTable: { columns: any[]; rows: PatientStatus[] } = {
    columns: PatientStatusesTable.columns,
    rows: [],
  };
  actions = PatientStatusesTable.actions;

  showCreatePatientStatus = false;
  panelTitle = 'patientStatuses.createPatientStatus';
  loadingMessage = '';
  patientStatusForms = JSON.parse(JSON.stringify(PatientStatusForm));
  hasErrors = false;
  errors: string[] = [];
  inputMode = true;
  showCancelButton = false;
  isCreateAction = false;
  selectedIndex = -1;
  patientStatus: PatientStatus = { name: '', description: '' };
  patientStatusFormGroup: FormGroup;

  constructor(
    private patientStatusesService: PatientStatusesService,
    private modalService: NzModalService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.patientStatusFormGroup = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.getPatientStatuses();
  }

  getPatientStatuses(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting }) {
    this.isLoading = true;
    this.patientStatuses = [];
    this.patientStatusesTable.rows = [];
    this.patientStatusesService
      .patientStatuses(params)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          data.patientStatuses.edges.map((patientStatus: any) => {
            this.patientStatuses.push(PatientStatusModel.fromJson(patientStatus.node));
          });
          this.patientStatusesTable.rows = this.patientStatuses;
          this.paging.after = data.patientStatuses.pageInfo.endCursor;
          this.paging.before = data.patientStatuses.pageInfo.startCursor;
          this.pageInfo = data.patientStatuses.pageInfo;
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('patientStatuses.unableLoadPatientStatuses'),
          })
      );
  }

  navigatePages(direction: string, pageSize: number = 10) {
    switch (direction) {
      case 'next':
        this.paging.before = undefined;
        this.paging.first = pageSize;
        this.paging.last = undefined;
        break;
      case 'previous':
        this.paging.after = undefined;
        this.paging.first = undefined;
        this.paging.last = pageSize;
        break;
    }
    this.getPatientStatuses({ paging: this.paging });
  }

  toggleCreatePanel(create: boolean = true) {
    this.isCreateAction = create;
    this.showCreatePatientStatus = !this.showCreatePatientStatus;
    this.panelTitle = this.isCreateAction
      ? 'patientStatuses.createPatientStatus'
      : 'patientStatuses.updatePatientStatus';
    if (create) {
      this.resetForm();
    }
  }

  closeCreatePanel(): void {
    this.showCreatePatientStatus = false;
    this.resetForm();
  }

  resetForm() {
    this.selectedIndex = -1;
    this.patientStatus = { name: '', description: '' };
    this.patientStatusFormGroup.reset({ name: '', description: '' });
    this.patientStatusForms.groups.forEach((group: FieldGroup) => {
      group.fields.forEach((field: Field) => {
        field.value = null;
      });
    });
  }

  handleActionClick(event: any): void {
    const patientStatus = event?.data || this.patientStatuses[event?.index];
    const index = Number.isFinite(event?.index) ? event.index : this.patientStatuses.indexOf(patientStatus);
    if (!patientStatus) return;

    this.selectedIndex = index;
    switch (event.action.name) {
      case 'patientStatuses.editPatientStatus':
        this.patientStatus = { ...patientStatus };
        this.patientStatusFormGroup.reset({
          name: this.patientStatus.name || '',
          description: this.patientStatus.description || '',
        });
        this.patientStatusForms.groups.forEach((group: FieldGroup) => {
          group.fields.forEach((field: Field) => {
            field.value = patientStatus[field.name];
          });
        });
        this.toggleCreatePanel(false);
        break;
      case 'patientStatuses.duplicatePatientStatus':
        this.duplicatePatientStatus(patientStatus);
        break;
      case 'patientStatuses.deletePatientStatus':
        this.modalService.confirm({
          nzTitle: this.translate.instant('core.confirm'),
          nzContent: this.translate.instant('patientStatuses.deletePatientStatusConfirm', {
            name: patientStatus.name,
          }),
          nzOkText: this.translate.instant('core.delete'),
          nzOnOk: () => this.deletePatientStatus(patientStatus),
          nzOkDisabled: this.modalLoading,
          nzCancelText: this.translate.instant('core.cancel'),
        });
        break;
    }
  }

  createPatientStatus(patientStatus: PatientStatus) {
    const normalizedPatientStatus = this.normalizePatientStatus(patientStatus);
    if (!normalizedPatientStatus) return;

    this.isLoading = true;
    this.hasErrors = false;
    this.errors = [];
    this.loadingMessage = this.translate.instant('patientStatuses.creatingPatientStatus', { name: normalizedPatientStatus.name });
    this.patientStatusesService
      .createPatientStatus(normalizedPatientStatus)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loadingMessage = '';
        })
      )
      .subscribe(
        ({ data }) => {
          const createdPatientStatus = data?.createOnePatientStatus;
          if (!createdPatientStatus) {
            this.errorService.handleError(new Error('Patient status response is empty'), {
              prefix: this.translate.instant('patientStatuses.unableCreatePatientStatus'),
            });
            return;
          }
          this.patientStatuses.unshift(PatientStatusModel.fromJson(createdPatientStatus));
          this.patientStatusesTable.rows = this.patientStatuses;
          this.closeCreatePanel();
          this.getPatientStatuses();
          this.message.create('success', this.translate.instant('patientStatuses.patientStatusCreated'));
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('patientStatuses.unableCreatePatientStatus'),
          })
      );
  }

  updatePatientStatus(patientStatus: PatientStatus) {
    const normalizedPatientStatus = this.normalizePatientStatus(patientStatus);
    if (!normalizedPatientStatus) return;

    this.isLoading = true;

    this.patientStatusesService
      .updatePatientStatus(normalizedPatientStatus)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }) => {
          const newPatientStatus = data?.updateOnePatientStatus;
          if (!newPatientStatus) {
            this.errorService.handleError(new Error('Patient status response is empty'), {
              prefix: this.translate.instant('patientStatuses.unableUpdatePatientStatus', { name: normalizedPatientStatus.name }),
            });
            return;
          }
          this.patientStatuses[this.selectedIndex] = PatientStatusModel.fromJson(newPatientStatus);
          this.closeCreatePanel();
          this.getPatientStatuses();
          this.message.success(this.translate.instant('patientStatuses.patientStatusUpdated'), {
            nzDuration: 3000,
          });
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('patientStatuses.unableUpdatePatientStatus', { name: normalizedPatientStatus.name }),
          })
      );
  }

  deletePatientStatus(patientStatus: PatientStatus) {
    this.modalLoading = true;
    this.patientStatusesService
      .deletePatientStatus(patientStatus)
      .pipe(finalize(() => (this.modalLoading = false)))
      .subscribe(
        () => {
          this.patientStatuses = this.patientStatuses.filter((currentStatus: PatientStatus) => currentStatus.id !== patientStatus.id);
          this.patientStatusesTable.rows = [...this.patientStatuses];
          this.message.create('success', this.translate.instant('patientStatuses.patientStatusDeleted'));
        },
        (error: any) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('patientStatuses.unableRemovePatientStatus', { name: patientStatus.name }),
          })
      );
  }

  submitForm(patientStatus: PatientStatus) {
    this.savePatientStatus(patientStatus);
  }

  submitPatientStatusDraft(): void {
    if (this.patientStatusFormGroup.invalid) {
      Object.values(this.patientStatusFormGroup.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const formValue = this.patientStatusFormGroup.getRawValue();
    this.savePatientStatus({
      ...this.patientStatus,
      name: formValue.name,
      description: formValue.description,
    });
  }

  private savePatientStatus(patientStatus: PatientStatus): void {
    const normalizedPatientStatus = this.normalizePatientStatus(this.extractPatientStatusPayload(patientStatus));
    if (!normalizedPatientStatus) return;

    if (this.isCreateAction) {
      this.createPatientStatus(normalizedPatientStatus);
    } else {
      const selectedPatientStatus = this.patientStatuses[this.selectedIndex];
      if (!selectedPatientStatus) {
        this.errorService.handleError(new Error('Patient status selection is missing'), {
          prefix: this.translate.instant('patientStatuses.unableUpdatePatientStatus', { name: normalizedPatientStatus.name }),
        });
        return;
      }
      normalizedPatientStatus.id = selectedPatientStatus.id;
      this.updatePatientStatus(normalizedPatientStatus);
    }
  }

  private duplicatePatientStatus(patientStatus: PatientStatus): void {
    const copy = this.normalizePatientStatus({
      ...patientStatus,
      id: undefined,
      name: this.copyName(patientStatus.name),
    });

    if (copy) this.createPatientStatus(copy);
  }

  private extractPatientStatusPayload(payload: any): PatientStatus {
    return payload?.patientStatus || payload?.data || payload;
  }

  private copyName(name: string): string {
    return `${name || ''} ${this.translate.instant('core.copySuffix')}`.trim();
  }

  private normalizePatientStatus(patientStatus: PatientStatus): PatientStatus | null {
    const name = patientStatus?.name?.trim();
    if (!name) {
      this.errorService.handleError(new Error('Patient status name is required'), {
        prefix: this.translate.instant('patientStatuses.nameValidation'),
      });
      return null;
    }

    return {
      id: patientStatus.id,
      name,
      description: patientStatus.description?.trim() || '',
    };
  }
}
