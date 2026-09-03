import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@env/environment';
import { Form } from '@shared/components/form/@types/form';
import { PermissionKey } from '@shared/@types/permission';
import { PageInfo, Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs/operators';
import { CaregiverForm } from '../@forms/contacts.form';
import { Caregiver } from '../@types/caregiver';
import { CaregiversService } from '../@services/caregivers.service';
import { PatientsService } from '../@services/patients.service';

const CryptoJS = require('crypto-js');

@Component({
  selector: 'app-caregiver-form',
  templateUrl: './caregiver-form.component.html',
  styleUrls: ['./caregiver-form.component.scss'],
})
export class CaregiverFormComponent implements OnInit {
  PK = PermissionKey;
  caregiverForm: Form = JSON.parse(JSON.stringify(CaregiverForm));
  caregiver: Partial<Caregiver> = {};
  isLoading = false;
  loadingMessage = '';
  populateForm = false;
  resetForm = false;
  private lockLinkedPatient = false;
  private lockEmergencyContact = false;
  private skipEmergencyContactCreation = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private caregiversService: CaregiversService,
    private patientsService: PatientsService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService
  ) {}

  ngOnInit(): void {
    this.requireLinkedPatient();
    this.readInitialData();
    this.populatePatientsDropDown({});
  }

  submitForm(caregiver: Caregiver): void {
    caregiver = {
      ...caregiver,
      patientId: this.lockLinkedPatient ? this.caregiver.patientId : caregiver.patientId,
      emergency: this.lockEmergencyContact ? true : caregiver.emergency,
      skipEmergencyContactCreation: this.skipEmergencyContactCreation,
    };
    if (!caregiver.patientId) {
      this.message.error('Debe seleccionarse un paciente para crear un cuidador.');
      return;
    }

    this.isLoading = true;
    this.loadingMessage = `Creating caregiver ${caregiver.firstName} ${caregiver.lastName}`;
    this.caregiversService
      .createCaregiver(caregiver)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.loadingMessage = '';
      }))
      .subscribe(
        () => {
          this.message.success('Caregiver has successfully been created');
          this.router.navigate(['/psira/case-management/caregiver-list']);
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to create caregiver' })
      );
  }

  searchPatients(search: any): void {
    if (search.field.name !== 'patientId') return;
    const keyword = `%${search.keyword}%`;
    this.populatePatientsDropDown({
      or: [{ firstName: { iLike: keyword } }, { middleName: { iLike: keyword } }, { lastName: { iLike: keyword } }],
    });
  }

  cancel(): void {
    this.router.navigate(['/psira/case-management/caregiver-list']);
  }

  private requireLinkedPatient(): void {
    const patientField = this.caregiverForm.groups[0].fields.find((field) => field.name === 'patientId');
    if (patientField) {
      patientField.isRequired = true;
      patientField.validationMessage = 'Debe seleccionarse un paciente';
    }
  }

  private readInitialData(): void {
    this.route.queryParams.subscribe((params) => {
      const draft = params.draft ? this.decrypt(params.draft) : {};
      const patient = params.patient ? this.decrypt(params.patient) : {};
      this.lockLinkedPatient = !!patient?.id;
      this.lockEmergencyContact = !!draft?.skipEmergencyContactCreation;
      this.skipEmergencyContactCreation = !!draft?.skipEmergencyContactCreation;
      this.caregiver = {
        ...draft,
        patientId: patient?.id || draft?.patientId,
      };
      this.ensureLinkedPatientOption(patient);
      this.applyFlowLocks();
      this.populateForm = true;
    });
  }

  private ensureLinkedPatientOption(patient: any): void {
    if (!patient?.id) return;
    const patientField = this.caregiverForm.groups[0].fields.find((field) => field.name === 'patientId');
    if (!patientField) return;
    const existingOptions = patientField.options || [];
    if (existingOptions.some((option) => Number(option.value) === Number(patient.id))) return;
    patientField.options = [
      {
        value: patient.id,
        label: [patient.medicalRecordNo, patient.firstName, patient.lastName].filter(Boolean).join(' '),
      },
      ...existingOptions,
    ];
  }

  private applyFlowLocks(): void {
    const fields = this.caregiverForm.groups[0].fields;
    const patientField = fields.find((field) => field.name === 'patientId');
    const emergencyField = fields.find((field) => field.name === 'emergency');
    if (patientField && this.lockLinkedPatient) {
      patientField.disabled = true;
    }
    if (emergencyField && this.lockEmergencyContact) {
      emergencyField.disabled = true;
      emergencyField.value = true;
    }
  }

  private decrypt(value: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(value, environment.secretKey);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (_) {
      return {};
    }
  }

  private populatePatientsDropDown(filter: any): void {
    this.patientsService.patients({ paging: { first: 25 } as Paging, filter: filter as Filter }).subscribe(
      ({ data }: any) => {
        const options = data.patients.edges.map((patient: any) => ({
          value: patient.node.id,
          label: [patient.node.medicalRecordNo, patient.node.firstName, patient.node.lastName].filter(Boolean).join(' '),
        }));
        const patientField = this.caregiverForm.groups[0].fields.find((field) => field.name === 'patientId');
        if (patientField) patientField.options = options;
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load patients' })
    );
  }
}
