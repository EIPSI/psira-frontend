import { Component, OnInit, ViewChild } from '@angular/core';
import { environment } from '@env/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { CaseManagerFilter } from '@app/pages/patients-management/@types/case-manager-filter';
import { FormattedPatient } from '@app/pages/patients-management/@types/formatted-patient';
import { PatientModel } from '@app/pages/patients-management/@models/patient.model';
import { PatientStatusesService } from '@app/pages/patients-management/@services/patient-statuses.service';
import { PatientsService } from '@app/pages/patients-management/@services/patients.service';
import { PatientStatus } from '@app/pages/patients-management/@types/patient-status';
import {
  CaseEventReason,
  CaseEventReasonContext,
  ClinicalSessionKind,
  TreatmentCycle,
  TreatmentCycleStatus,
} from '@app/pages/calendar/@types/calendar';
import { CalendarService } from '@app/pages/calendar/@services/calendar.service';
import { finalize } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ErrorHandlerService } from '@app/@shared/services/error-handler.service';
import { UsersService } from '@app/pages/user-management/@services/users.service';
import { User } from '@app/pages/user-management/@types/user';
import { userForms } from '@app/pages/user-management/@forms/user.form';
import { Form } from '@shared/components/form/@types/form';
import { FormComponent } from '@shared/components/form/form.component';
import { UserUpdatePasswordInput } from '@app/pages/user-management/user-form/user-update-password.type';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DeleteOneInput } from '@app/@shared/@types/delete-one-input';
import { PermissionKey } from '@app/@shared/@types/permission';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { EvaluationAutomationsService } from '@app/pages/evaluation-automations/@services/evaluation-automations.service';
import {
  EvaluationAutomationTriggerPoint,
  EvaluationAutomationTriggerPointLabel,
} from '@app/pages/evaluation-automations/@types/evaluation-automation';
import { PatientCalendarComponent } from '../calendar/patient-calendar.component';

const CryptoJS = require('crypto-js');

@Component({
  selector: 'app-patient-profile',
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.scss'],
})
export class PatientProfileComponent implements OnInit {
  @ViewChild('patientPasswordForm') patientPasswordForm: FormComponent;
  @ViewChild(PatientCalendarComponent) patientCalendar?: PatientCalendarComponent;
  public CSK = ClinicalSessionKind;
  public TCS = TreatmentCycleStatus;
  public PK = PermissionKey;
  public triggerPointLabel = EvaluationAutomationTriggerPointLabel;
  patient: FormattedPatient;
  patientAccountUser: User;
  filter: CaseManagerFilter;
  patientStatuses: PatientStatus[] = [];
  loading = false;
  accountLoading = false;
  passwordModalVisible = false;
  updatePasswordForm: Form = userForms.updateUserPassword;
  cycleLoading = false;
  cycleSaving = false;
  selectedTabIndex = 0;
  activeTreatmentCycle?: TreatmentCycle;
  finalizeModalVisible = false;
  newTreatmentModalVisible = false;
  cancelFinalizationModalVisible = false;
  finalizationReasonLevels: CaseEventReason[][] = [];
  selectedFinalizationReasonIds: number[] = [];
  finalizationRootLabel = 'Motivo';
  finalizationReasonId?: number;
  finalizationOtherReason = '';
  finalizationNote = '';
  finalizationLastSessionNumber?: number;
  newTreatmentReasonLevels: CaseEventReason[][] = [];
  selectedNewTreatmentReasonIds: number[] = [];
  newTreatmentRootLabel = 'Motivo';
  newTreatmentReasonId?: number;
  newTreatmentOtherReason = '';
  newTreatmentNote = '';
  cancelFinalizationNote = '';
  automationPreview: any[] = [];
  automationPreviewLoading = false;
  skippedAutomationIds: number[] = [];

  get showFinalizationOtherReason(): boolean {
    return this.isSelectedOtherReason(this.finalizationReasonLevels, this.finalizationReasonId);
  }

  get showNewTreatmentOtherReason(): boolean {
    return this.isSelectedOtherReason(this.newTreatmentReasonLevels, this.newTreatmentReasonId);
  }

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
    private calendarService: CalendarService,
    private usersService: UsersService,
    private evaluationAutomationsService: EvaluationAutomationsService,
    private modalService: NzModalService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService
  ) {}

  ngOnInit(): void {
    this.getPatient();
    this.getPatientStatuses();
  }

  getPatient() {
    this.activatedRoute.queryParams.subscribe((params: any) => {
      if (params.profile) {
        const bytes = CryptoJS.AES.decrypt(params.profile, environment.secretKey);
        const patient = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        this.patient = PatientModel.fromJson(patient);
        this.filter = {
          patientId: this.patient.id,
        };
        this.loadPatientAccountUser();
        this.loadTreatmentCycle();
      }
      this.selectedTabIndex = params.tab === 'sessions' ? 2 : 0;
    });
  }

  loadTreatmentCycle(): void {
    if (!this.patient?.id) return;
    this.cycleLoading = true;
    this.calendarService
      .getActiveTreatmentCycle({
        patientId: this.patient.id,
        cycleKind: ClinicalSessionKind.CLINICAL,
      })
      .pipe(finalize(() => (this.cycleLoading = false)))
      .subscribe(
        (cycle) => {
          this.activeTreatmentCycle = cycle;
          this.finalizationLastSessionNumber = cycle?.lastSessionNumber;
          this.detectLastSessionNumber();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load treatment cycle' })
      );
  }

  openFinalizeTreatment(): void {
    this.finalizeModalVisible = true;
    this.finalizationReasonId = undefined;
    this.selectedFinalizationReasonIds = [];
    this.finalizationReasonLevels = [];
    this.finalizationOtherReason = '';
    this.finalizationNote = '';
    this.resetAutomationPreview();
    this.loadReasonRootLabel(CaseEventReasonContext.TREATMENT_FINALIZATION, (label) => (this.finalizationRootLabel = label));
    this.loadReasonLevel(CaseEventReasonContext.TREATMENT_FINALIZATION, undefined, this.finalizationReasonLevels, 0);
    this.detectLastSessionNumber();
    this.refreshReasonAutomationPreview(
      EvaluationAutomationTriggerPoint.TREATMENT_FINALIZATION,
      CaseEventReasonContext.TREATMENT_FINALIZATION,
      []
    );
  }

  openNewTreatment(): void {
    this.newTreatmentModalVisible = true;
    this.newTreatmentReasonId = undefined;
    this.selectedNewTreatmentReasonIds = [];
    this.newTreatmentReasonLevels = [];
    this.newTreatmentOtherReason = '';
    this.newTreatmentNote = '';
    this.resetAutomationPreview();
    this.loadReasonRootLabel(CaseEventReasonContext.NEW_TREATMENT, (label) => (this.newTreatmentRootLabel = label));
    this.loadReasonLevel(CaseEventReasonContext.NEW_TREATMENT, undefined, this.newTreatmentReasonLevels, 0);
    this.refreshReasonAutomationPreview(
      EvaluationAutomationTriggerPoint.NEW_TREATMENT,
      CaseEventReasonContext.NEW_TREATMENT,
      []
    );
  }

  openCancelFinalization(): void {
    this.cancelFinalizationNote = '';
    this.cancelFinalizationModalVisible = true;
  }

  canUndoFinalization(): boolean {
    if (!this.activeTreatmentCycle?.finalizationUndoExpiresAt) return false;
    return new Date(this.activeTreatmentCycle.finalizationUndoExpiresAt).getTime() > Date.now();
  }

  onFinalizationReasonChange(levelIndex: number, reasonId?: number): void {
    this.selectReason(
      CaseEventReasonContext.TREATMENT_FINALIZATION,
      this.finalizationReasonLevels,
      this.selectedFinalizationReasonIds,
      levelIndex,
      reasonId,
      (id) => (this.finalizationReasonId = id)
    );
    this.refreshReasonAutomationPreview(
      EvaluationAutomationTriggerPoint.TREATMENT_FINALIZATION,
      CaseEventReasonContext.TREATMENT_FINALIZATION,
      this.selectedFinalizationReasonIds
    );
  }

  onNewTreatmentReasonChange(levelIndex: number, reasonId?: number): void {
    this.selectReason(
      CaseEventReasonContext.NEW_TREATMENT,
      this.newTreatmentReasonLevels,
      this.selectedNewTreatmentReasonIds,
      levelIndex,
      reasonId,
      (id) => (this.newTreatmentReasonId = id)
    );
    this.refreshReasonAutomationPreview(
      EvaluationAutomationTriggerPoint.NEW_TREATMENT,
      CaseEventReasonContext.NEW_TREATMENT,
      this.selectedNewTreatmentReasonIds
    );
  }

  finalizationReasonLevelLabel(levelIndex: number): string {
    return this.reasonLevelLabel(this.finalizationReasonLevels, this.selectedFinalizationReasonIds, levelIndex, this.finalizationRootLabel);
  }

  newTreatmentReasonLevelLabel(levelIndex: number): string {
    return this.reasonLevelLabel(this.newTreatmentReasonLevels, this.selectedNewTreatmentReasonIds, levelIndex, this.newTreatmentRootLabel);
  }

  confirmFinalizeTreatment(): void {
    if (!this.finalizationReasonId) {
      this.message.warning('Seleccioná un motivo.');
      return;
    }
    if (this.showFinalizationOtherReason && !this.finalizationOtherReason.trim()) {
      this.message.warning('Completá Otro motivo.');
      return;
    }
    this.cycleSaving = true;
    this.calendarService
      .finalizeTreatmentCycle({
        treatmentCycleId: this.activeTreatmentCycle?.id,
        patientId: this.patient.id,
        cycleKind: ClinicalSessionKind.CLINICAL,
        finalizationReasonId: this.finalizationReasonId,
        finalizationOtherReason: this.showFinalizationOtherReason
          ? this.finalizationOtherReason.trim() || undefined
          : undefined,
        finalizationNote: this.finalizationNote,
        lastSessionNumber: this.finalizationLastSessionNumber ? Number(this.finalizationLastSessionNumber) : undefined,
        excludedAutomationIds: this.skippedAutomationIds,
      })
      .pipe(finalize(() => (this.cycleSaving = false)))
      .subscribe(
        (cycle) => {
          this.activeTreatmentCycle = cycle;
          this.finalizeModalVisible = false;
          this.refreshCalendarAfterAutomationTrigger();
          this.message.success('Tratamiento finalizado');
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to finalize treatment' })
      );
  }

  confirmCancelFinalization(): void {
    if (!this.activeTreatmentCycle?.id) return;
    this.cycleSaving = true;
    this.calendarService
      .cancelTreatmentCycleFinalization(this.activeTreatmentCycle.id, this.cancelFinalizationNote)
      .pipe(finalize(() => (this.cycleSaving = false)))
      .subscribe(
        (cycle) => {
          this.activeTreatmentCycle = cycle;
          this.cancelFinalizationModalVisible = false;
          this.refreshCalendarAfterAutomationTrigger();
          this.message.success('Finalización anulada');
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to cancel finalization' })
      );
  }

  confirmNewTreatment(): void {
    if (!this.newTreatmentReasonId) {
      this.message.warning('Seleccioná un motivo.');
      return;
    }
    if (this.showNewTreatmentOtherReason && !this.newTreatmentOtherReason.trim()) {
      this.message.warning('Completá Otro motivo.');
      return;
    }
    this.cycleSaving = true;
    this.calendarService
      .startNewTreatmentCycle({
        previousTreatmentCycleId: this.activeTreatmentCycle?.id,
        patientId: this.patient.id,
        cycleKind: ClinicalSessionKind.CLINICAL,
        newTreatmentReasonId: this.newTreatmentReasonId,
        newTreatmentOtherReason: this.showNewTreatmentOtherReason
          ? this.newTreatmentOtherReason.trim() || undefined
          : undefined,
        newTreatmentNote: this.newTreatmentNote,
        excludedAutomationIds: this.skippedAutomationIds,
      })
      .pipe(finalize(() => (this.cycleSaving = false)))
      .subscribe(
        (cycle) => {
          this.activeTreatmentCycle = cycle;
          this.newTreatmentModalVisible = false;
          this.refreshCalendarAfterAutomationTrigger();
          this.message.success('Nuevo tratamiento iniciado');
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to start new treatment' })
      );
  }

  toggleAutomationPreview(automationId: number, checked: boolean): void {
    this.skippedAutomationIds = checked
      ? this.skippedAutomationIds.filter((id) => id !== automationId)
      : [...new Set([...this.skippedAutomationIds, automationId])];
  }

  automationPreviewChecked(automationId: number): boolean {
    return !this.skippedAutomationIds.includes(automationId);
  }

  private resetAutomationPreview(): void {
    this.automationPreview = [];
    this.skippedAutomationIds = [];
    this.automationPreviewLoading = false;
  }

  private refreshCalendarAfterAutomationTrigger(): void {
    this.patientCalendar?.loadEvents();
  }

  private refreshReasonAutomationPreview(
    triggerPoint: EvaluationAutomationTriggerPoint,
    reasonContext: CaseEventReasonContext,
    reasonIds: number[]
  ): void {
    const departmentIds = this.patientDepartmentIds();
    if (!departmentIds.length) {
      this.resetAutomationPreview();
      return;
    }

    this.automationPreviewLoading = true;
    this.evaluationAutomationsService
      .previewAutomations({
        roleCodes: ['PATIENT'],
        departmentIds,
        triggerPoint,
        reasonContexts: [reasonContext],
        reasonIds: (reasonIds || []).filter((id) => !!id),
      })
      .pipe(finalize(() => (this.automationPreviewLoading = false)))
      .subscribe(
        (automations) => {
          this.automationPreview = automations || [];
          const availableIds = this.automationPreview.map((automation) => automation.automationId);
          this.skippedAutomationIds = this.skippedAutomationIds.filter((id) => availableIds.includes(id));
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load automation preview' })
      );
  }

  private patientDepartmentIds(): number[] {
    return (this.patient?.departments || [])
      .map((department: any) => Number(department.id))
      .filter((id: number) => Number.isFinite(id));
  }

  getPatientStatuses() {
    this.patientStatusesService.patientStatuses().subscribe(
      (result: any) => {
        this.patientStatuses = result.data.patientStatuses.edges.map((e: any) => e.node);
      },
      (error: any) => this.errorService.handleError(error, { prefix: 'Unable to load patient statuses' })
    );
  }

  changeStatus(statusId: number) {
    this.loading = true;
    this.patientsService
      .changePatientStatus(this.patient.id, statusId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ data }) => {
          this.patient = PatientModel.fromJson(data.changePatientStatus);
          this.message.success('Patient status updated successfully');
        },
        (error: any) => this.errorService.handleError(error, { prefix: 'Unable to update patient status' })
      );
  }

  loadPatientAccountUser(): void {
    if (!this.patient?.userId) {
      this.patientAccountUser = null;
      return;
    }
    this.accountLoading = true;
    this.usersService
      .getUsers({
        paging: { first: 1 },
        filter: { id: { eq: this.patient.userId } },
      })
      .pipe(finalize(() => (this.accountLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.patientAccountUser = data?.users?.edges?.[0]?.node || null;
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load patient user account' })
      );
  }

  canManagePatientAccount(): boolean {
    return (
      !!this.patientAccountUser?.id &&
      this.perms.permissionsOnly([PermissionKey.MANAGE_USERS]) &&
      this.perms.hasAccessLevelToUser(this.patientAccountUser)
    );
  }

  canDeletePatientAccount(): boolean {
    return (
      !!this.patientAccountUser?.id &&
      this.perms.permissionsOnly([PermissionKey.DELETE_USERS]) &&
      this.perms.hasAccessLevelToUser(this.patientAccountUser)
    );
  }

  setPatientAccountActive(active: boolean): void {
    if (!this.patientAccountUser?.id) return;
    this.accountLoading = true;
    this.usersService
      .updateUser({ id: this.patientAccountUser.id, update: { active } })
      .pipe(finalize(() => (this.accountLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.patientAccountUser = data?.updateOneUser || { ...this.patientAccountUser, active };
          this.message.success('User account updated successfully');
        },
        (error) => {
          this.patientAccountUser = { ...this.patientAccountUser, active: !active };
          this.errorService.handleError(error, { prefix: 'Unable to update patient user account' });
        }
      );
  }

  showPatientPasswordForm(): void {
    this.resetPatientPasswordForm();
    this.passwordModalVisible = true;
  }

  submitPatientPasswordForm(): void {
    this.patientPasswordForm?.handleSubmitForm(this.updatePasswordForm);
  }

  updatePatientUserPassword(form: any): void {
    if (!this.patientAccountUser?.id) return;
    const inputs: UserUpdatePasswordInput = {
      id: this.patientAccountUser.id,
      newPassword: form.newPassword,
      newPasswordConfirmation: form.newPasswordConfirmation,
    };
    this.accountLoading = true;
    this.usersService
      .updateUserPassword(inputs)
      .pipe(finalize(() => (this.accountLoading = false)))
      .subscribe(
        () => {
          this.passwordModalVisible = false;
          this.resetPatientPasswordForm();
          this.message.success('Password has successfully been changed');
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to change password' })
      );
  }

  handleDeletePatientAccount(): void {
    if (!this.patientAccountUser?.id) return;
    this.modalService.confirm({
      nzTitle: 'Confirm',
      nzContent: `Are you sure you want to delete ${this.patientAccountUser.firstName} ${this.patientAccountUser.lastName}`,
      nzOkText: 'Delete',
      nzOnOk: () => this.deletePatientAccount(),
      nzCancelText: 'Cancel',
    });
  }

  deletePatientAccount(): void {
    if (!this.patientAccountUser?.id) return;
    const input: DeleteOneInput = { id: this.patientAccountUser.id };
    this.accountLoading = true;
    this.usersService
      .deleteOneUser(input)
      .pipe(finalize(() => (this.accountLoading = false)))
      .subscribe(
        () => this.router.navigate(['/psira/case-management/patients']),
        (error) =>
          this.errorService.handleError(error, {
            prefix: `Unable to delete user "${this.patientAccountUser.firstName} ${this.patientAccountUser.lastName}"`,
          })
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

  private resetPatientPasswordForm(): void {
    this.updatePasswordForm.groups.map((group) => group.fields.map((field) => (field.value = '')));
  }

  private detectLastSessionNumber(): void {
    if (!this.patient?.id) return;
    this.calendarService
      .getClinicalSessions({
        patientId: this.patient.id,
        sessionKind: ClinicalSessionKind.CLINICAL,
        includeCancelled: false,
      })
      .subscribe(
        (sessions) => {
          const now = Date.now();
          const elapsedSessions = sessions
            .filter((session) => {
              const startAt = session.calendarOccurrence?.startAt;
              return startAt && new Date(startAt).getTime() <= now;
            })
            .sort((left, right) =>
              new Date(left.calendarOccurrence?.startAt || 0).getTime() -
              new Date(right.calendarOccurrence?.startAt || 0).getTime()
            );
          const lastSession = elapsedSessions[elapsedSessions.length - 1];
          if (lastSession?.sessionNumber) this.finalizationLastSessionNumber = Number(lastSession.sessionNumber);
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to detect last session' })
      );
  }

  private selectReason(
    context: CaseEventReasonContext,
    levels: CaseEventReason[][],
    selectedIds: number[],
    levelIndex: number,
    reasonId: number | undefined,
    assign: (id: number | undefined) => void
  ): void {
    selectedIds.splice(levelIndex);
    levels.splice(levelIndex + 1);
    if (!reasonId) {
      assign(selectedIds[selectedIds.length - 1]);
      return;
    }
    selectedIds[levelIndex] = reasonId;
    assign(reasonId);
    this.loadReasonLevel(context, reasonId, levels, levelIndex + 1);
  }

  private loadReasonLevel(
    context: CaseEventReasonContext,
    parentId: number | undefined,
    targetLevels: CaseEventReason[][],
    levelIndex: number
  ): void {
    this.calendarService.getCaseEventReasons(context, parentId).subscribe(
      (reasons) => {
        if (reasons.length) {
          targetLevels[levelIndex] = reasons;
        }
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load reasons' })
    );
  }

  private loadReasonRootLabel(
    context: CaseEventReasonContext,
    assign: (label: string) => void
  ): void {
    this.calendarService.getCaseEventReasonTrees(false).subscribe(
      (trees) => {
        const tree = (trees || []).find((item) =>
          item.context === context &&
          !item.departmentId
        ) || (trees || []).find((item) => item.context === context);
        assign(tree?.levelLabels?.[0] || 'Motivo');
      },
      () => assign('Motivo')
    );
  }

  private reasonLevelLabel(
    levels: CaseEventReason[][],
    selectedIds: number[],
    levelIndex: number,
    rootLabel: string
  ): string {
    if (levelIndex === 0) return rootLabel;
    const parentId = selectedIds[levelIndex - 1];
    const parent = levels[levelIndex - 1]?.find(
      (reason) => Number(reason.id) === Number(parentId)
    );
    return parent?.nextLevelLabel || 'Submotivo';
  }

  private isSelectedOtherReason(levels: CaseEventReason[][], reasonId?: number): boolean {
    if (!reasonId) return false;
    return levels.some((level) => level.some((reason) => Number(reason.id) === Number(reasonId) && !!reason.isOther));
  }
}
