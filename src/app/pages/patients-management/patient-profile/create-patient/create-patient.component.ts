import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PatientsService } from '../../@services/patients.service';
import { Patient } from '../../@types/patient';
import { environment } from '@env/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { PatientCreateForm, PatientUpdateForm } from '@app/pages/patients-management/@forms/patient-form';
import { PatientModel } from '@app/pages/patients-management/@models/patient.model';
import { EmergencyContactsService } from '@app/pages/patients-management/@services/contacts.service';
import { Contact } from '@app/pages/patients-management/@types/contact';
import { PermissionKey } from '@app/@shared/@types/permission';
import { ErrorHandlerService } from '../../../../@shared/services/error-handler.service';
import { finalize } from 'rxjs/operators';
import { DepartmentsService } from '@app/pages/patients-management/@services/departments.service';
import { UsersService } from '@app/pages/user-management/@services/users.service';
import { EvaluationAutomationsService } from '@app/pages/evaluation-automations/@services/evaluation-automations.service';
import { EvaluationAutomationTriggerPointLabel } from '@app/pages/evaluation-automations/@types/evaluation-automation';
import { SettingsService } from '@app/pages/administration/@services/settings.service';
import { Department } from '@app/pages/patients-management/@types/department';

const CryptoJS = require('crypto-js');

@Component({
  selector: 'app-create-patient',
  templateUrl: './create-patient.component.html',
  styleUrls: ['./create-patient.component.scss'],
})
export class CreatePatientComponent implements OnInit {
  PK = PermissionKey;
  isLoading = false;
  populateForm = false;
  resetForm = false;
  loadingMessage = '';
  patientForm = PatientCreateForm;
  patientUpdateForm = PatientUpdateForm;
  patient: Patient;
  inputMode = true;
  showCancelButton = false;
  automationPreview: any[] = [];
  automationPreviewLoading = false;
  skippedAutomationIds: number[] = [];
  triggerPointLabel: any = EvaluationAutomationTriggerPointLabel;
  selectedDepartmentIds: number[] = [];
  departmentOptions: Array<{ label: string; value: number }> = [];
  caseManagerOptions: Array<{ label: string; value: number }> = [];
  selectedCaseManagerId: number = null;
  medicalRecordNo = '';
  private caseManagerHierarchyRankCutoff = 500;

  constructor(
    private patientsService: PatientsService,
    private emergencyContactsService: EmergencyContactsService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    private activatedRoute: ActivatedRoute,
    private departmentsService: DepartmentsService,
    private usersService: UsersService,
    private evaluationAutomationsService: EvaluationAutomationsService,
    private settingsService: SettingsService,
    private router: Router,
    public perms: AppPermissionsService
  ) {}

  ngOnInit(): void {
    this.getPatientFromUrl();
    this.getDepartments();
    this.getCaseManagerSettings();
  }

  public submitForm(patientData: Patient): void {
    if (!this.selectedDepartmentIds.length) {
      this.message.error('Debe seleccionarse al menos una Institución');
      return;
    }

    patientData.medicalRecordNo = this.medicalRecordNo;
    patientData.departmentIds = this.selectedDepartmentIds;
    patientData.caseManagerIds = this.selectedCaseManagerId ? [this.selectedCaseManagerId] : [];

    if (this.patient) {
      patientData.id = this.patient.id;
      this.updatePatient(patientData);
    } else {
      this.createPatient(patientData);
    }
  }

  public handleDepartmentSelection(departmentIds: number[]): void {
    this.selectedDepartmentIds = departmentIds || [];
    if (!this.patient) {
      this.refreshAutomationPreview(this.selectedDepartmentIds);
    }
  }

  public handleInputModeChanged(inputMode: boolean): void {
    this.inputMode = inputMode;
  }

  public toggleAutomationPreview(automationId: number, checked: boolean): void {
    this.skippedAutomationIds = checked
      ? this.skippedAutomationIds.filter((id) => id !== automationId)
      : [...new Set([...this.skippedAutomationIds, automationId])];
  }

  public automationPreviewChecked(automationId: number): boolean {
    return !this.skippedAutomationIds.includes(automationId);
  }

  public automationsForTrigger(triggerPoint: string): any[] {
    return this.automationPreview.filter((automation) => automation.triggerPoint === triggerPoint);
  }

  public automationPreviewTriggerPoints(): string[] {
    return [...new Set(this.automationPreview.map((automation) => automation.triggerPoint))];
  }

  public selectedDepartmentLabels(): string {
    if (!this.selectedDepartmentIds.length) return '-';
    const patientDepartmentLabels = (this.patient?.departments || [])
      .filter((department: any) => this.selectedDepartmentIds.map(Number).includes(Number(department.id)))
      .map((department: any) => department.name);
    if (patientDepartmentLabels.length) return patientDepartmentLabels.join(', ');
    return this.selectedDepartmentIds
      .map(
        (departmentId) =>
          this.departmentOptions.find((option) => Number(option.value) === Number(departmentId))?.label || departmentId
      )
      .join(', ');
  }

  public selectedCaseManagerLabel(): string {
    if (!this.selectedCaseManagerId) return '-';
    const patientCaseManager = (this.patient?.caseManagers || []).find(
      (caseManager: any) => Number(caseManager.id) === Number(this.selectedCaseManagerId)
    );
    if (patientCaseManager) {
      return [patientCaseManager.firstName, patientCaseManager.lastName].filter((name) => !!name).join(' ');
    }
    return (
      this.caseManagerOptions.find((option) => Number(option.value) === Number(this.selectedCaseManagerId))?.label ||
      String(this.selectedCaseManagerId)
    );
  }

  private getPatientFromUrl(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.resetForm = false;
      this.populateForm = false;
      if (params.profile) {
        this.inputMode = false;
        this.showCancelButton = true;
        const bytes = CryptoJS.AES.decrypt(params.profile, environment.secretKey);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        this.patient = decryptedData;
        if (this.patient.birthDate) {
          this.patient.birthDate = decryptedData.birthDate.slice(0, 10);
        }
        this.medicalRecordNo = this.patient.medicalRecordNo || '';
        if (this.patient.departments) {
          this.patient.departmentIds = (this.patient.departments as any).map((department: any) => department.id);
          this.selectedDepartmentIds = this.patient.departmentIds || [];
        }
        if (this.patient.caseManagers) {
          this.patient.caseManagerIds = (this.patient.caseManagers as any)[0]?.id;
          this.selectedCaseManagerId = this.patient.caseManagerIds as any;
        }
        this.populateForm = true;
      } else {
        this.inputMode = true;
        this.showCancelButton = false;
        this.resetForm = true;
        this.medicalRecordNo = '';
        this.selectedDepartmentIds = [];
        this.selectedCaseManagerId = null;
      }
    });
  }

  private createEmergencyContacts(patientId: number, contacts: Contact[]) {
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return;
    }
    this.isLoading = true;
    contacts.map((contact: Contact) => {
      contact.patientId = patientId;
    });
    this.emergencyContactsService
      .createManyEmergencyContacts(contacts)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loadingMessage = '';
        })
      )
      .subscribe(
        () => {
          this.populateForm = false;
          this.resetForm = true;
          this.message.success('Emergency contacts have successfully been created');
          this.router.navigate(['/psira/case-management/patients']);
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: 'Unable to create emergency contacts',
          })
      );
  }

  private createPatient(patient: Patient) {
    this.isLoading = true;
    this.resetForm = false;
    this.populateForm = false;
    const emergencyContacts = patient.emergencyContacts;
    patient.emergencyContacts = undefined;

    if (this.getAccessScope() === 'ASSIGNED') {
      patient.caseManagerIds = [JSON.parse(localStorage.getItem('user')).id];
    }
    patient.skippedAutomationIds = this.skippedAutomationIds;

    this.loadingMessage = `Creating patient ${patient.firstName} ${patient.lastName}`;
    this.patientsService
      .createPatient(PatientModel.updateData(patient))
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        async ({ data }: any) => {
          const patientData = data.createOnePatient;
          this.router.navigate(['/psira/case-management/patients']);
          this.message.success('Patient has successfully been created');
          patient.emergencyContacts = emergencyContacts;
          this.createEmergencyContacts(patientData.id, emergencyContacts);
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: 'Unable to create patient',
          })
      );
  }

  private updatePatient(patient: Patient) {
    this.isLoading = true;
    this.loadingMessage = `Updating patient ${patient.firstName} ${patient.lastName}`;
    patient.emergencyContacts = undefined;
    this.patientsService
      .updatePatient(PatientModel.updateData(patient))
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loadingMessage = '';
        })
      )
      .subscribe(
        async ({ data }) => {
          const patientData = data.updateOnePatient;
          PatientModel.fromJson(patientData);
          this.message.create('success', `Patient has successfully been updated`);
          this.router.navigate(['/psira/case-management/patients']);
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: `Unable to update patient "${patient.firstName} ${patient.lastName}"`,
          })
      );
  }

  private refreshAutomationPreview(departmentValue: any): void {
    const departmentIds = Array.isArray(departmentValue)
      ? departmentValue
      : [departmentValue].filter((id) => !!id);

    if (!departmentIds.length) {
      this.automationPreview = [];
      this.skippedAutomationIds = [];
      return;
    }

    this.automationPreviewLoading = true;
    this.evaluationAutomationsService
      .previewAutomations({
        roleCodes: ['PATIENT'],
        departmentIds: departmentIds.map(Number),
      })
      .pipe(finalize(() => (this.automationPreviewLoading = false)))
      .subscribe(
        (automations) => {
          this.automationPreview = automations;
          const availableIds = automations.map((automation) => automation.automationId);
          this.skippedAutomationIds = this.skippedAutomationIds.filter((id) => availableIds.includes(id));
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load automation preview' })
      );
  }

  public getAccessScope(): 'ALL' | 'DEPARTMENT' | 'ASSIGNED' {
    if (this.canSeeAllPatients()) {
      return 'ALL';
    }
    if (this.perms.permissionsOnly(PermissionKey.VIEW_DEPARTMENT_PATIENTS)) {
      return 'DEPARTMENT';
    }
    return 'ASSIGNED';
  }

  private canSeeAllPatients(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roles = user?.roles || [];
    const permissions = [
      ...(user.permissions || []),
      ...(user.permissionGrants || []),
      ...roles.reduce((rolePermissions: any[], role: any) => rolePermissions.concat(role.permissions || []), []),
    ];
    return !!(
      user?.isSuperUser ||
      roles.some((role: any) => {
        const normalizedRoleName = String(role.name || '').toLowerCase().replace(/[\s_-]/g, '');
        return (
          role.isSuperAdmin ||
          role.code === 'SUPER_ADMIN' ||
          Number(role.hierarchy) === 1 ||
          normalizedRoleName === 'superadmin'
        );
      }) ||
      permissions.some((permission: any) =>
        [PermissionKey.VIEW_ALL_PATIENTS, PermissionKey.MANAGE_USERS, PermissionKey.MANAGE_SETTINGS].includes(
          permission?.name
        )
      ) ||
      this.perms.permissionsOnly([
        PermissionKey.VIEW_ALL_PATIENTS,
        PermissionKey.MANAGE_USERS,
        PermissionKey.MANAGE_SETTINGS,
      ])
    );
  }

  private getDepartments(): void {
    const scope = this.getAccessScope();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (scope !== 'ALL') {
      const userDepartments = user.departments || [];
      this.setDepartmentOptions(userDepartments, scope);
      this.departmentsService
        .departments({ paging: { first: 1 }, filter: { name: { eq: 'Particular' } } })
        .subscribe(
          (particularResponse) => {
            const particular = particularResponse.data.departments.edges.map((e: any) => e.node)[0];
            const departments = userDepartments;
            const allDepartments =
              particular && !departments.some((department: any) => department.id === particular.id)
                ? [...departments, particular]
                : departments;
            this.setDepartmentOptions(allDepartments, scope);
          },
          (error) => this.errorService.handleError(error, { prefix: 'Unable to load Particular department' })
        );
      return;
    }

    this.loadAllDepartmentOptions(scope);
  }

  private loadAllDepartmentOptions(
    scope: 'ALL' | 'DEPARTMENT' | 'ASSIGNED',
    after?: string,
    accumulatedDepartments: Department[] = []
  ): void {
    this.departmentsService.departments({ paging: { first: 50, after } }).subscribe(
      (response) => {
        const page = response.data.departments;
        const departments = [...accumulatedDepartments, ...page.edges.map((e: any) => e.node)];

        if (page.pageInfo?.hasNextPage) {
          this.loadAllDepartmentOptions(scope, page.pageInfo.endCursor, departments);
          return;
        }

        this.setDepartmentOptions(departments, scope);
      },
      (error) => {
        this.errorService.handleError(error, { prefix: 'Unable to load departments' });
      }
    );
  }

  private setDepartmentOptions(departments: any[], scope: 'ALL' | 'DEPARTMENT' | 'ASSIGNED'): void {
    const options = departments.map((department: any) => ({
      label: department.name,
      value: department.id,
    }));
    this.departmentOptions = options;
    if (!this.selectedDepartmentIds.length && scope === 'ASSIGNED' && options.length) {
      this.selectedDepartmentIds = options.map((option) => Number(option.value));
      this.refreshAutomationPreview(this.selectedDepartmentIds);
    }
  }

  private getCaseManagers(): void {
    const scope = this.getAccessScope();
    const user = JSON.parse(localStorage.getItem('user'));
    const filter: any = {
      and: [
        {
          roles: {
            hierarchy: {
              lte: this.caseManagerHierarchyRankCutoff,
            },
          },
        },
      ],
    };

    if (scope === 'DEPARTMENT') {
      const departmentIds = user.departments?.map((d: any) => d.id) || [];
      filter.and.push({
        departments: {
          id: {
            in: departmentIds,
          },
        },
      });
    } else if (scope === 'ASSIGNED') {
      filter.and.push({
        id: {
          eq: user.id,
        },
      });
    }

    this.usersService.getUsers({ paging: { first: 50 }, filter }).subscribe((response) => {
      const currentHierarchy = this.strongestHierarchy(user);
      const options = response.data.users.edges
        .map((e: any) => e.node)
        .filter((candidate: any) => {
          const candidateHierarchy = this.strongestHierarchy(candidate);
          return candidateHierarchy >= currentHierarchy && candidateHierarchy <= this.caseManagerHierarchyRankCutoff;
        })
        .map((candidate: any) => ({
          label: [candidate.firstName, candidate.lastName].filter((n: any) => !!n).join(' '),
          value: candidate.id,
        }));
      this.caseManagerOptions = options;
      if (scope === 'ASSIGNED') {
        this.selectedCaseManagerId = user.id;
      }
    });
  }

  private getCaseManagerSettings(): void {
    this.settingsService.settings().subscribe(
      ({ data }) => {
        this.caseManagerHierarchyRankCutoff = Number(data.settings?.patientCaseManagerAssignableHierarchyRank) || 500;
        this.getCaseManagers();
      },
      () => this.getCaseManagers()
    );
  }

  private strongestHierarchy(user: any): number {
    const hierarchies = (user?.roles || [])
      .map((role: any) => Number(role.hierarchy))
      .filter((hierarchy: number) => Number.isFinite(hierarchy));
    return hierarchies.length ? Math.min(...hierarchies) : Number.MAX_SAFE_INTEGER;
  }
}
