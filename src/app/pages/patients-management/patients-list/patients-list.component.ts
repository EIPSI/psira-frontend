import { Component } from '@angular/core';
import { PatientColumns } from '../@tables/patients.table';
import { PatientsService } from '@app/pages/patients-management/@services/patients.service';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { PatientModel } from '@app/pages/patients-management/@models/patient.model';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Sorting } from '@shared/@types/sorting';
import { PatientStatus } from '@app/pages/patients-management/@types/patient-status';
import { PatientStatusesService } from '@app/pages/patients-management/@services/patient-statuses.service';
import { FormattedPatient } from '../@types/formatted-patient';
import { finalize } from 'rxjs/operators';
import { SelectModalComponent } from '../../../@shared/components/select-modal/select-modal.component';
import { PageInfo, Paging } from '../../../@shared/@types/paging';
import { Filter } from '../../../@shared/@types/filter';
import { User } from '@app/pages/user-management/@types/user';
import { PermissionKey } from '@app/@shared/@types/permission';
import { AppPermissionsService } from '../../../@shared/services/app-permissions.service';
import { ErrorHandlerService } from '../../../@shared/services/error-handler.service';
import {
  TableColumn,
  SortField,
  Action,
  ActionArgs,
  DEFAULT_PAGE_SIZE,
} from '../../../@shared/@modules/master-data/@types/list';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { encryptRouteObject, encryptRoutePayload, decryptRoutePayload } from '@app/@shared/utils/route-crypto.util';


enum ActionKey {
  DELETE_PATIENT,
  ARCHIVE_PATIENT,
  RESTORE_PATIENT,
  CHANGE_STATUS,
}

@Component({
  selector: 'app-patients',
  templateUrl: './patients-list.component.html',
  styleUrls: ['./patients-list.component.scss'],
})
export class PatientsListComponent {
  PK = PermissionKey;

  public columns: TableColumn<Partial<FormattedPatient>>[] = PatientColumns as TableColumn<Partial<FormattedPatient>>[];

  public translatedColumns: TableColumn<Partial<FormattedPatient>>[] = [];

  public data: Partial<FormattedPatient>[];

  public pageInfo: PageInfo;

  public patientRequestOptions: {
    paging: Paging;
    filter: Filter;
    sorting: Sorting[];
  } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
  };

  public end = false;

  public loading = false;

  public actions: Action<ActionKey>[] = [];

  public patientStates: PatientStatus[] = [];

  public onlyMyPatients = (localStorage.getItem('onlyMyPatients') === 'true');
  public archivedPatients = (localStorage.getItem('archivedPatients') === 'true');

  constructor(
    private patientsService: PatientsService,
    private router: Router,
    private modalService: NzModalService,
    private message: NzMessageService,
    private patientStateService: PatientStatusesService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService,
    private translate: TranslateService
  ) {
    if(!localStorage.getItem('onlyMyPatients')){
      localStorage.setItem('onlyMyPatients', this.onlyMyPatients.toString());
    }
    if(!localStorage.getItem('archivedPatients')){
      localStorage.setItem('archivedPatients', this.archivedPatients.toString());
    }
    this.getPatients();
    this.getPatientStates();
    this.setActions();
  }

  public searchPatients(searchString: string): void {
    this.patientRequestOptions.filter = {
      or: this.createSearchFilter(searchString),
    };
    this.getPatients();
  }

  public onPageChange(paging: Paging): void {
    this.patientRequestOptions.paging = paging;
    this.getPatients();
  }

  public onSort(sorting: SortField<FormattedPatient>[]): void {
    this.patientRequestOptions.sorting = sorting;
    this.getPatients();
  }

  public onFilter(filter: Filter): void {
    this.patientRequestOptions.filter = filter;
    this.getPatients();
  }

  public onMyPatients(): void {
    if(this.onlyMyPatients === true){
      localStorage.setItem('onlyMyPatients', 'false');
      this.onlyMyPatients = false;
   }
    else{
      localStorage.setItem('onlyMyPatients', 'true');
      this.onlyMyPatients = true;
    }
    this.getPatients();
  }

  public onArchievedPatients(): void {
    if(this.archivedPatients === true){
      localStorage.setItem('archivedPatients', 'false');
      this.archivedPatients = false;
    }
    else{
      localStorage.setItem('archivedPatients', 'true');
      this.archivedPatients = true;
    }
    this.getPatients();
  }

  public onPatientSelect(patient: FormattedPatient): void {
    const dataString = encryptRouteObject(patient, environment.secretKey);
    this.router.navigate(['/psira/case-management/profile'], {
      queryParams: {
        profile: dataString,
      },
    });
  }

  public onAction({ action, context: patient }: ActionArgs<FormattedPatient, ActionKey>): void {
    switch (action.key) {
      case ActionKey.ARCHIVE_PATIENT:
        this.archivePatient(patient);
        return;
      case ActionKey.RESTORE_PATIENT:
        this.restorePatient(patient);
        return;
      case ActionKey.DELETE_PATIENT:
        this.deletePatient(patient);
        return;
      case ActionKey.CHANGE_STATUS:
        this.changePatientStatus(patient);
        return;
    }
  }

  private getPatients(): void {
    this.loading = true;
    const options = { ...this.patientRequestOptions };

    if(!this.archivedPatients){
      options.filter = {
        ...options.filter,
        and: [{ deleted: {is: false} }, ...(options.filter.and ?? [])],
      };
    }  


    // apply for only my patients
    if (this.onlyMyPatients){
      options.filter = {
        ...options.filter,
        and: [{ caseManagers: { id: { eq: this.userId } } }, ...(options.filter.and ?? [])],
      };
    }

    // archieved patients

    if(this.archivedPatients){
      options.filter = {
        ...options.filter,
        and: [{ deleted: {is: true} }, ...(options.filter.and ?? [])],
      };
    }  

    this.patientsService
      .patients(options)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (patients) => {
          this.data = patients.data.patients.edges.map((e: any) => PatientModel.fromJson(e.node));
          this.pageInfo = patients.data.patients.pageInfo; // TODO: remove
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: 'Unable to load patients',
          })
      );
  }

  private createSearchFilter(searchString: string) {
    return [
      { firstName: { iLike: `%${searchString}%` } },
      { middleName: { iLike: `%${searchString}%` } },
      { lastName: { iLike: `%${searchString}%` } },
      { medicalRecordNo: { iLike: `%${searchString}%` } },
    ];
  }

  private getPatientStates() {
    this.patientStateService.patientStatuses().subscribe(
      (result) => {
        this.patientStates = result.data.patientStatuses.edges.map((e: any) => e.node);

        // append status options on status filter
        const statusCol = this.columns.find((c) => c.name === 'formattedStatus');
        statusCol.filterField.options = [
          ...this.patientStates.map((ps) => ({ label: ps.name, value: ps.id })),
          { label: this.translate.instant('patientsManagement.notSet'), value: null },
        ];
        this.columns = [...this.columns]; // trigger setter to re-render filter
      },
      (error) =>
        this.errorService.handleError(error, {
          prefix: 'Unable to load patient statuses',
        })
    );
  }

  private async changePatientStatus(patient: FormattedPatient): Promise<void> {
    // create state modal
    const modal = this.modalService.create<SelectModalComponent<PatientStatus>>({
      nzTitle: this.translate.instant('patientsManagement.changePatientStatusTitle', {
        name: `${patient.firstName} ${patient.lastName}`,
      }),
      nzContent: SelectModalComponent,
      nzComponentParams: {
        options: this.patientStates,
        selected: this.patientStates.find((s) => s.id === patient.statusId),
        titleField: 'name',
      },
      nzOnOk: (m) => m.selected,
    });

    // wait for modal to successfully complete
    const state: PatientStatus = await modal.afterClose.toPromise();
    if (!state) return;

    this.loading = true;
    this.patientsService
      .changePatientStatus(patient.id, state.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ data }) => {
          patient = PatientModel.fromJson(data.changePatientStatus);
          const list = [...this.data];
          list.splice(
            list.findIndex((p) => p.id === patient.id),
            1,
            patient
          );
          // modify reference to trigger change detection
          this.data = list;
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: `Unable to change patient status of "${patient.firstName} ${patient.lastName}"`,
          })
      );
  }

  private async deletePatient(patient: FormattedPatient): Promise<void> {
    // create confirmation modal
    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: this.translate.instant('patientsManagement.deletePatient'),
      nzContent: this.translate.instant('patientsManagement.deletePatientConfirm', {
        name: `${patient.firstName} ${patient.lastName}`,
      }),
    });

    // wait for modal to successfully complete
    const confirmation = await modal.afterClose.toPromise();
    if (!confirmation) return;

    // delete patient
    this.loading = true;
    this.patientsService
      .deletePatient(patient)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => {
          this.data.splice(this.data.indexOf(patient), 1);
          this.message.success(this.translate.instant('patientsManagement.patientDeleted'));
          this.getPatients();
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('patientsManagement.unableDeletePatient', {
              name: `${patient.firstName} ${patient.lastName}`,
            }),
          })
      );
  }

  private async archivePatient(patient: FormattedPatient): Promise<void> {
    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: this.translate.instant('patientsManagement.archivePatient'),
      nzContent: this.translate.instant('patientsManagement.archivePatientConfirm', {
        name: `${patient.firstName} ${patient.lastName}`,
      }),
    });

    const confirmation = await modal.afterClose.toPromise();
    if (!confirmation) return;

    // archive patient
    this.loading = true;
    this.patientsService
      .archivePatient(patient)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => {
          this.getPatients();
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('patientsManagement.unableArchivePatient', {
              name: `${patient.firstName} ${patient.lastName}`,
            }),
          })
      );
  }

  private async restorePatient(patient: FormattedPatient): Promise<void> {
    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: this.translate.instant('patientsManagement.restorePatient'),
      nzContent: this.translate.instant('patientsManagement.restorePatientConfirm', {
        name: `${patient.firstName} ${patient.lastName}`,
      }),
    });

    const confirmation = await modal.afterClose.toPromise();
    if (!confirmation) return;

    // restore patient
    this.loading = true;
    this.patientsService
      .restorePatient(patient)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        () => {
          this.getPatients();
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('patientsManagement.unableRestorePatient', {
              name: `${patient.firstName} ${patient.lastName}`,
            }),
          })
      );
  }


  private get userId(): number {
    const user = JSON.parse(localStorage.getItem('user')) as User;
    return user.id ?? 0;
  }

  private setActions(): void {
    if (this.perms.permissionsOnly(PermissionKey.PATIENTS_EDIT_DEPARTMENT)) {
      this.actions = [...this.actions, { key: ActionKey.CHANGE_STATUS, title: 'patientsManagement.changeStatus' }];
      this.actions = [...this.actions, { key: ActionKey.ARCHIVE_PATIENT, title: 'patientsManagement.archivePatient' }];
      this.actions = [...this.actions, { key: ActionKey.RESTORE_PATIENT, title: 'patientsManagement.restorePatient' }];
    }

    if (this.perms.permissionsOnly(PermissionKey.PATIENTS_DELETE_DEPARTMENT)) {
      this.actions = [...this.actions, { key: ActionKey.DELETE_PATIENT, title: 'patientsManagement.deletePatient' }];
    }
  }
}
