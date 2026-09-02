import { Component, Input, OnInit } from '@angular/core';
import { PermissionKey } from '@shared/@types/permission';
import {
  Action,
  ActionArgs,
  DEFAULT_PAGE_SIZE,
  SortField,
  TableColumn,
} from '@shared/@modules/master-data/@types/list';
import { CaregiverTable } from '../@tables/contact.table';
import { CaregiverForm } from '../@forms/contacts.form';
import { PageInfo, Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { finalize } from 'rxjs/operators';
import { Sorting } from '@shared/@types/sorting';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { CaregiversService } from '@app/pages/patients-management/@services/caregivers.service';
import {
  Caregiver,
  FormattedCaregiver,
  PatientRelation,
  UpdateOneCaregiverInput,
} from '@app/pages/patients-management/@types/caregiver';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PatientsService } from '@app/pages/patients-management/@services/patients.service';
import { CaregiversPatientService } from '@app/pages/patients-management/@services/caregivers-patient.service';

enum ActionKey {
  DELETE_CAREGIVER,
}

@Component({
  selector: 'app-caregiver-list',
  templateUrl: './caregiver-list.component.html',
  styleUrls: ['./caregiver-list.component.scss'],
})
export class CaregiverListComponent implements OnInit {
  @Input() public caregivers: Caregiver[] = [];

  public PK = PermissionKey;
  public data: Partial<Caregiver>[];
  public columns: TableColumn<Partial<Caregiver>>[] = CaregiverTable as TableColumn<Partial<Caregiver>>[];

  // form properties
  public showCreateCaregiver = false;
  public populateForm = false;
  public resetForm = false;
  public caregiver: Caregiver;
  public caregiverForm = CaregiverForm;

  public actions: Action<ActionKey>[] = [];

  public caregiverRequestOptions: { paging: Paging; filter: Filter; sorting: Sorting[] } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
  };

  public pageInfo: PageInfo;
  public end = false;
  public isLoading = false;

  constructor(
    private caregiversService: CaregiversService,
    private caregiversPatientService: CaregiversPatientService,
    private patientsService: PatientsService,
    public perms: AppPermissionsService,
    private errorService: ErrorHandlerService,
    private modalService: NzModalService
  ) {}

  ngOnInit(): void {
    this.getCaregiver();
    this.populatePatientsDropDown({});
    if (this.perms.permissionsOnly(PermissionKey.MANAGE_PATIENTS)) {
      this.actions = [{ key: ActionKey.DELETE_CAREGIVER, title: 'Delete Caregiver' }];
    }
  }

  public onPageChange(paging: Paging): void {
    this.caregiverRequestOptions.paging = paging;
    this.getCaregiver();
  }

  public onSort(sorting: SortField<Caregiver>[]): void {
    this.caregiverRequestOptions.sorting = sorting;
    this.getCaregiver();
  }

  public onFilter(filter: Filter): void {
    this.caregiverRequestOptions.filter = filter;
    this.getCaregiver();
  }

  public onSearch(searchString: string): void {
    this.caregiverRequestOptions.filter = { or: this.createSearchFilter(searchString) };
    this.getCaregiver();
  }

  public openCreatePanel(caregiver?: Caregiver): void {
    if (caregiver) {
      this.caregiver = caregiver;
    }
    console.log(this.caregiver);
    this.showCreateCaregiver = true;
    this.populateForm = true;
    this.resetForm = true;
    if (this.perms.permissionsOnly(PermissionKey.MANAGE_PATIENTS)) {
      this.actions = [{ key: ActionKey.DELETE_CAREGIVER, title: 'Delete Caregiver' }];
    }
  }

  public closeCreatePanel(): void {
    this.caregiver = null;
    this.showCreateCaregiver = false;
    this.populateForm = false;
    this.resetForm = false;
  }

  public onSubmitForm(caregiver: Caregiver): void {
    if (this.caregiver?.id) {
      caregiver.id = this.caregiver.id;
      this.updateCaregiver(caregiver);
    } else {
      this.createCaregiver(caregiver);
    }
  }

  public onAction({ action, context: caregiver }: ActionArgs<FormattedCaregiver, ActionKey>): void {
    switch (action.key) {
      case ActionKey.DELETE_CAREGIVER:
        this.deleteCaregiver(caregiver);
        return;
    }
  }

  public onAction1(context: PatientRelation): void {
    this.deleteCaregiverPatient(context);
  }

  public patientRelationNameSort = (a: PatientRelation, b: PatientRelation): number =>
    this.compareText(this.patientRelationName(a), this.patientRelationName(b));

  public patientRelationDateSort = (a: PatientRelation, b: PatientRelation): number =>
    this.timeValue(this.patientRelationPatient(a)?.birthDate) - this.timeValue(this.patientRelationPatient(b)?.birthDate);

  public patientRelationMedicalRecordSort = (a: PatientRelation, b: PatientRelation): number =>
    this.compareText(this.patientRelationPatient(a)?.medicalRecordNo, this.patientRelationPatient(b)?.medicalRecordNo);

  public patientRelationRelationSort = (a: PatientRelation, b: PatientRelation): number =>
    this.compareText(a.relation, b.relation);

  public searchPatients(search: any): void {
    if (search.field.name !== 'patientId') return;

    const keyword = `%${search.keyword}%`;
    this.populatePatientsDropDown({
      or: [{ firstName: { iLike: keyword } }, { middleName: { iLike: keyword } }, { lastName: { iLike: keyword } }],
    });
  }

  public handleRowClick(event: any) {
    if (!this.perms.permissionsOnly([PermissionKey.MANAGE_PATIENTS])) return;
    this.populateForm = true;
    this.openCreatePanel(event);
  }

  private getCaregiver(getAllCaregivers: boolean = false): void {
    this.isLoading = true;
    this.caregiversService
      .caregivers(this.caregiverRequestOptions)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((response) => {
        if (getAllCaregivers) {
          this.caregivers = response.data.caregivers?.edges.map((e: any) => e.node);
        } else {
          this.data = response.data.caregivers?.edges.map((e: any) => e.node);
        }
        this.pageInfo = response.data.caregivers?.pageInfo; // TODO: remove
      });
  }

  private createSearchFilter(searchString: string): Array<{ [K in keyof Partial<FormattedCaregiver>]: {} }> {
    if (!searchString) return [];
    return [{ firstName: { iLike: `%${searchString}%` } }, { lastName: { iLike: `%${searchString}%` } }];
  }

  private patientRelationName(relation: PatientRelation): string {
    const patient = this.patientRelationPatient(relation);
    return `${patient?.firstName || ''} ${patient?.lastName || ''}`;
  }

  private patientRelationPatient(relation: PatientRelation): any {
    return relation?.patient as any;
  }

  private compareText(a: any, b: any): number {
    return String(a || '').localeCompare(String(b || ''), undefined, { numeric: true, sensitivity: 'base' });
  }

  private timeValue(value: any): number {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private populatePatientsDropDown(filter: any): void {
    this.patientsService.patients({ paging: { first: 25 }, filter }).subscribe(
      ({ data }: any) => {
        const options = data.patients.edges.map((patient: any) => ({
          value: patient.node.id,
          label: [patient.node.medicalRecordNo, patient.node.firstName, patient.node.lastName].filter(Boolean).join(' '),
        }));
        const patientField = this.caregiverForm.groups[0].fields.find((field) => field.name === 'patientId');
        if (patientField) patientField.options = options;
      },
      (err) => this.errorService.handleError(err, { prefix: 'Unable to load patients' })
    );
  }

  private async deleteCaregiver(caregiver: FormattedCaregiver): Promise<void> {
    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: 'Delete caregiver',
      nzContent: `
        Are you sure you want to delete ${caregiver.firstName}? This action is irreversible.
      `,
    });

    if (!(await modal.afterClose.toPromise())) return;

    this.isLoading = true;
    this.caregiversService
      .deleteCaregiver(caregiver)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => {
          const data = [...this.data];
          data.splice(this.data.indexOf(caregiver), 1);
          this.data = data; // mutate reference to trigger change detection
        },
        (err) => this.errorService.handleError(err, { prefix: `Unable to delete caregiver "${caregiver.firstName}"` })
      );
  }

  private async deleteCaregiverPatient(patientRelation: PatientRelation): Promise<void> {
    const modal = this.modalService.confirm({
      nzOnOk: () => true,
      nzTitle: 'Delete relation',
      nzContent: `
        Are you sure you want to remove this caregiver for the patient?
      `,
    });

    if (!(await modal.afterClose.toPromise())) return;

    this.isLoading = true;
    this.caregiversService
      .deleteCaregiverPatient(patientRelation.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => {
          this.caregiver.patientCaregivers = this.caregiver.patientCaregivers.filter(
            (relation) => relation.id !== patientRelation.id
          );
        },
        (err) =>
          this.errorService.handleError(err, { prefix: `Unable to delete relation "${patientRelation.relation}"` })
      );
  }

  private createCaregiver(caregiver: Caregiver): void {
    const patientCaregiverData = {
      patientId: caregiver.patientId,
      relation: caregiver.relation,
      note: caregiver.note,
      emergency: caregiver.emergency,
    };
    const caregiverInput = { ...caregiver };
    delete caregiverInput.patientId;
    delete caregiverInput.relation;
    delete caregiverInput.note;
    delete caregiverInput.emergency;

    this.isLoading = true;
    this.populateForm = false;
    this.resetForm = false;
    this.caregiversService
      .createCaregiver(caregiverInput)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }) => {
          if (patientCaregiverData.patientId) {
            this.caregiversPatientService
              .addCaregiversToPatient(patientCaregiverData.patientId, {
                ...data.createOneCaregiver,
                relation: patientCaregiverData.relation,
                note: patientCaregiverData.note,
                emergency: patientCaregiverData.emergency,
              })
              .subscribe(
                () => {
                  this.closeCreatePanel();
                  this.getCaregiver();
                },
                (err) => this.errorService.handleError(err, { prefix: 'Unable to link Caregiver to patient' })
              );
            return;
          }

          this.data = [...this.data, data.createOneCaregiver];
          this.closeCreatePanel();
          this.getCaregiver();
        },
        (err) => this.errorService.handleError(err, { prefix: 'Unable to create Caregiver' })
      );
  }

  private updateCaregiver(caregiver: Caregiver): void {
    const caregiverLocal = JSON.parse(JSON.stringify(caregiver));
    delete caregiverLocal.patientId;
    delete caregiverLocal.relation;
    delete caregiverLocal.emergency;
    delete caregiverLocal.note;
    const id = caregiverLocal.id;
    delete caregiverLocal.id;
    const updateOneCaregiverInput: UpdateOneCaregiverInput = {
      id,
      update: caregiverLocal,
    };
    this.isLoading = true;
    this.caregiversService
      .updateCaregiver(updateOneCaregiverInput)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }) => {
          const list = [...this.data];
          const updatedCaregiver: Caregiver = data.updateOneCaregiver;
          const idx = list.findIndex((car) => car.id === updatedCaregiver.id);
          list.splice(idx, 1, updatedCaregiver);
          this.data = list; // mutate reference to trigger change detection
          this.closeCreatePanel();
        },
        (err) => this.errorService.handleError(err, { prefix: 'Unable to update caregiver' })
      );
  }
}
