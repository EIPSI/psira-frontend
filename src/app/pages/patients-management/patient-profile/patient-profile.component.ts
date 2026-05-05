import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { CaseManagerFilter } from '@app/pages/patients-management/@types/case-manager-filter';
import { FormattedPatient } from '@app/pages/patients-management/@types/formatted-patient';
import { PatientModel } from '@app/pages/patients-management/@models/patient.model';
import { PatientStatusesService } from '@app/pages/patients-management/@services/patient-statuses.service';
import { PatientsService } from '@app/pages/patients-management/@services/patients.service';
import { PatientStatus } from '@app/pages/patients-management/@types/patient-status';
import { finalize } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ErrorHandlerService } from '@app/@shared/services/error-handler.service';

const CryptoJS = require('crypto-js');

@Component({
  selector: 'app-patient-profile',
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.scss'],
})
export class PatientProfileComponent implements OnInit {
  patient: FormattedPatient;
  filter: CaseManagerFilter;
  patientStatuses: PatientStatus[] = [];
  loading = false;

  get patientTitle(): string {
    const name = [this.patient?.firstName, this.patient?.middleName, this.patient?.lastName]
      .filter((s) => !!s)
      .join(' ');
    return [this.patient?.medicalRecordNo, name].filter((s) => !!s).join(' - ');
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private patientStatusesService: PatientStatusesService,
    private patientsService: PatientsService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.getPatient();
    this.getPatientStatuses();
  }

  getPatient() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params.profile) {
        const bytes = CryptoJS.AES.decrypt(params.profile, environment.secretKey);
        const patient = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        this.patient = PatientModel.fromJson(patient);
        this.filter = {
          patientId: this.patient.id,
        };
      }
    });
  }

  getPatientStatuses() {
    this.patientStatusesService.patientStatuses().subscribe(
      (result) => {
        this.patientStatuses = result.data.patientStatuses.edges.map((e: any) => e.node);
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load patient statuses' })
    );
  }

  changeStatus(statusId: number) {
    this.loading = true;
    const updateData = { ...this.patient, statusId };
    this.patientsService
      .updatePatient(PatientModel.updateData(updateData))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ data }) => {
          this.patient = PatientModel.fromJson(data.updateOnePatient);
          this.message.success('Patient status updated successfully');
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to update patient status' })
      );
  }

  goBack() {
    this.router.navigate(['/psira/case-management/patients']);
  }

  getToken() {
    const userStr = localStorage.getItem('auth_app_token');
    const user = JSON.parse(userStr);
    return user.accessToken;
  }
}
