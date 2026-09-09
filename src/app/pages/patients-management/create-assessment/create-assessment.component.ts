import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormattedPatient } from '@app/pages/patients-management/@types/formatted-patient';
import { PatientModel } from '@app/pages/patients-management/@models/patient.model';
import { environment } from '@env/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { CaseManagerFilter } from '@app/pages/patients-management/@types/case-manager-filter';
import { QuestionnaireVersion } from '@app/pages/questionnaire-management/@types/questionnaire';
import { User } from '@app/pages/user-management/@types/user';
import { finalize } from 'rxjs/operators';
import { SelectedCaregiver } from '@app/pages/patients-management/@types/caregiver';
import { PageInfo, Paging } from '@shared/@types/paging';
import { CaregiversPatientService } from '@app/pages/patients-management/@services/caregivers-patient.service';
import { Filter } from '@shared/@types/filter';
import { Sorting } from '@shared/@types/sorting';
import { Convert } from '@shared/classes/convert';
import { Department } from '@app/pages/administration/@types/department';
import { ErrorHandlerService } from '@shared/services/error-handler.service';
import { DepartmentsService } from '@app/pages/administration/@services/departments.service';
import { AssessmentService } from '@app/pages/assessment/@services/assessment.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FullAssessment } from '../../assessment/@types/assessment';
import { AssessmentAdministration } from '@app/pages/administration/@types/assessment-administration';
import { AssessmentAdministrationService } from '@app/pages/administration/@services/assessment-administration.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { LocationStrategy } from '@angular/common';
import { QuestionnaireBundlesService } from '@app/pages/questionnaire-management/@services/questionnaire-bundles.service';
import { RandomizationsService } from '@app/pages/randomizations/@services/randomizations.service';
import { RandomizationRule, RandomizationRuleType } from '@app/pages/randomizations/@types/randomization';

const CryptoJS = require('crypto-js');

enum AssessmentContentType {
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  QUESTIONNAIRE_BUNDLE = 'QUESTIONNAIRE_BUNDLE',
  RANDOMIZATION = 'RANDOMIZATION',
}

@Component({
  selector: 'app-create-assessment',
  templateUrl: './create-assessment.component.html',
  styleUrls: ['./create-assessment.component.scss'],
})
export class CreateAssessmentComponent implements OnInit {
  formGroup: FormGroup;
  deliveryDate: any = null;
  expireDate: any = null;
  typeSelected: any = 'PATIENT';
  dataToSelect: any = [];
  selectedInformant: any = null;
  listOfBundles: any = [];
  listOfSelectedBundles: any = [];
  listOfRandomizations: RandomizationRule[] = [];
  listOfSelectedRandomizations: number[] = [];
  public assessmentContentType = AssessmentContentType.QUESTIONNAIRE;
  public ACT = AssessmentContentType;
  noteValue: any = '';
  patientEmail = '';
  options = [
    { label: 'planAssessment.relations.mother', value: 'Mother' },
    { label: 'planAssessment.relations.father', value: 'Father' },
    { label: 'planAssessment.relations.grandparent', value: 'Grandparent' },
    { label: 'planAssessment.relations.uncleAunt', value: 'Uncle/Aunt' },
    { label: 'planAssessment.relations.extendedFamily', value: 'Extended Family' },
    { label: 'planAssessment.relations.legalGuardian', value: 'Legal Guardian' },
    { label: 'planAssessment.relations.familyDoctor', value: 'Family Doctor' },
    { label: 'planAssessment.relations.externalPaediatrician', value: 'External Paediatrician' },
    { label: 'planAssessment.relations.externalPsychotherapist', value: 'External Psychotherapist' },
    { label: 'planAssessment.relations.externalPsychologist', value: 'External Psychologist' },
    { label: 'planAssessment.relations.externalSocialWorker', value: 'External Social Worker' },
    { label: 'planAssessment.relations.externalNurse', value: 'External Nurse' },
    { label: 'planAssessment.relations.emergencyDepartment', value: 'Emergency Department' },
    { label: 'planAssessment.relations.friend', value: 'Friend' },
    { label: 'planAssessment.relations.neighbour', value: 'Neighbour' },
    { label: 'planAssessment.relations.teacher', value: 'Teacher' },
    { label: 'planAssessment.relations.schoolRepresentative', value: 'School Representative' },
    { label: 'planAssessment.relations.advisor', value: 'Advisor' },
    { label: 'planAssessment.relations.legalAdvisor', value: 'Legal Advisor' },
    { label: 'planAssessment.relations.assistance', value: 'Assistance' },
    { label: 'planAssessment.relations.supervisor', value: 'Supervisor' },
    { label: 'planAssessment.relations.other', value: 'Other' },
  ];
  public selectedAssessment: any = null;
  public assessmentAdministration: Partial<AssessmentAdministration>[];
  public fullAssessment: FullAssessment;
  public isLoading = false;
  public selectedClinician: User;
  public selectedResponsibleUserIds: number[] = [];
  public caseAdministrators: User[] = [];
  public users: User[] = [];
  @Input() public patient: FormattedPatient;
  @Input() public assessment: FullAssessment;
  @Input() public embedded = false;
  @Input() public startEditing = false;
  @Input() public caregivers: SelectedCaregiver[] = [];
  @Output() public selectionChange = new EventEmitter<QuestionnaireVersion[]>();
  @Output() public saved = new EventEmitter<void>();
  @Output() public cancelled = new EventEmitter<void>();
  filter: CaseManagerFilter;
  public data: Partial<SelectedCaregiver>[];
  public departments: Department[] = [];
  public editMode = true;
  public pageInfo: PageInfo;
  public assessmentUrl: URL;
  public selectedQuestionnaires: QuestionnaireVersion[] = [];
  public checked = false;
  public isUpdate: boolean;
  public timeUnits = [
    { value: 'MINUTES', label: 'time.minutes' },
    { value: 'HOURS', label: 'time.hours' },
    { value: 'DAYS', label: 'time.days' },
    { value: 'WEEKS', label: 'time.weeks' },
    { value: 'MONTHS', label: 'time.months' },
  ];

  get patientTitle(): string {
    const name = [this.patient?.firstName, this.patient?.middleName, this.patient?.lastName]
      .filter((s) => !!s)
      .join(' ');
    return [this.patient?.medicalRecordNo, name].filter((s) => !!s).join(' - ');
  }

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private caregiversPatientService: CaregiversPatientService,
    private assessmentAdministrationService: AssessmentAdministrationService,
    private errorService: ErrorHandlerService,
    private departmentsService: DepartmentsService,
    private bundlesService: QuestionnaireBundlesService,
    private randomizationsService: RandomizationsService,
    private assessmentService: AssessmentService,
    private nzMessage: NzMessageService,
    private clipboard: Clipboard,
    private locationStrategy: LocationStrategy
  ) {}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      assessmentTypeId: [null, Validators.required],
      name: [null],
      clinicianId: [null, Validators.required],
      responsibleUserIds: [[]],
      targetUserId: [null, Validators.required],
      responderUserId: [null, Validators.required],
      informantPatient: [null],
      informantClinicianId: [null],
      informantCaregiverRelation: [null],
      informantType: [null],
      deliveryDate: [null],
      expirationDate: [null],
      reminderMinutes: [''],
      reminderUnit: ['MINUTES'],
      questionnaireBundles: [[]],
      randomizationRuleIds: [[]],
      note: [null],
      dates: this.formBuilder.array([
        this.formBuilder.group({
          expirationDate: [null],
          deliveryDate: [null],
          reminderMinutes: [''],
          reminderUnit: ['MINUTES'],
        }),
      ]),
    });
    this.getAssessmentTypes();
    this.userAutoSelect();
    this.initAssessment();
    this.getPatient();
    this.getBundles();
    this.getRandomizations();
    this.getCaregivers();
    this.getUserDepartments({ paging: { first: 50 } });
    if (this.patient?.id) {
    }
  }

  get datesFieldAsFormArray(): FormArray {
    return this.formGroup.get('dates') as FormArray;
  }

  get dates(): FormArray {
    return this.formGroup.get('dates') as FormArray;
  }

  addControl(): void {
    this.datesFieldAsFormArray.push(
      this.formBuilder.group({
        expirationDate: [null],
        deliveryDate: [null],
        reminderMinutes: [''],
      })
    );
  }

  remove(i: number): void {
    this.datesFieldAsFormArray.removeAt(i);
  }

  public goBack(patient: FormattedPatient): void {
    const dataString = CryptoJS.AES.encrypt(JSON.stringify(this.patient), environment.secretKey).toString();
    console.log(this.patient);
    this.router.navigate(['/psira/case-management/profile'], {
      queryParams: {
        profile: dataString,
      },
    });
  }

  public onSelectChange(event: any) {
    if (!this.editMode) {
      return;
    }
    if (event === 'PATIENT') {
      this.dataToSelect = [
        {
          label: this.patient.firstName + ' ' + this.patient.lastName + ' ' + this.patient.medicalRecordNo,
          value: this.patient.userId,
          email: this.patient.email,
        },
      ];
      this.selectedInformant = this.patient?.userId;
    } else if (event === `CASE_MANAGER`) {
      this.dataToSelect = (this.patient?.caseManagers ?? []).map((user) => ({
        label: user.firstName + ' ' + user.lastName,
        value: user.id,
        email: user.email,
      }));
      this.selectedInformant = this.dataToSelect[0]?.value;
    } else if (event === `OTHER_USER`) {
      this.dataToSelect = this.users.map((user) => ({
        label: user.firstName + ' ' + user.lastName,
        value: user.id,
        email: user.email,
      }));
      this.selectedInformant = this.dataToSelect[0]?.value;
    } else if (event === `CAREGIVER`) {
      this.dataToSelect = this.caregivers
        .filter((caregiver) => caregiver.userId)
        .map((caregiver) => ({
          label: [caregiver.firstName, caregiver.lastName, caregiver.relation ? `(${caregiver.relation})` : null]
            .filter(Boolean)
            .join(' '),
          value: caregiver.userId,
          email: caregiver.email,
          relation: caregiver.relation,
        }));
      this.selectedInformant = this.dataToSelect[0]?.value;
    }
    this.applySelectedResponder();
  }

  public onResponderSelect(userId: number): void {
    this.selectedInformant = userId;
    this.applySelectedResponder();
  }

  public onQuestionnaireSelected(questionnaires: QuestionnaireVersion[]): void {
    this.selectedQuestionnaires = questionnaires;
  }

  public onAssessmentContentTypeChange(type: AssessmentContentType): void {
    this.assessmentContentType = type;
    if (type !== AssessmentContentType.QUESTIONNAIRE) this.selectedQuestionnaires = [];
    if (type !== AssessmentContentType.QUESTIONNAIRE_BUNDLE) this.listOfSelectedBundles = [];
    if (type !== AssessmentContentType.RANDOMIZATION) this.listOfSelectedRandomizations = [];
    this.formGroup.patchValue({
      questionnaireBundles: this.selectedBundleIds(),
      randomizationRuleIds: this.selectedRandomizationRuleIds(),
    });
  }

  public userAutoSelect() {
    const userLocalStorage = JSON.parse(localStorage.getItem('user')) as User;
    this.selectedClinician = userLocalStorage;
    this.selectedResponsibleUserIds = userLocalStorage?.id ? [userLocalStorage.id] : [];
    this.formGroup?.patchValue({
      clinicianId: userLocalStorage?.id,
      responsibleUserIds: this.selectedResponsibleUserIds,
    });
  }

  public onUserSelect(user: User) {
    this.formGroup.patchValue({ clinicianId: user?.id });
  }

  public userLabel(user: User): string {
    return [user?.firstName, user?.middleName, user?.lastName]
      .filter((part) => !!part)
      .join(' ') || user?.username || user?.email || `Usuario ${user?.id}`;
  }

  private buildCaseAdministratorOptions(): User[] {
    const managers = [...(this.patient?.caseManagers || [])];
    const managerIds = (this.patient?.caseManagerIds || []).map((id) => Number(id)).filter((id) => Number.isFinite(id));
    const currentUser = JSON.parse(localStorage.getItem('user')) as User;
    const currentUserId = Number(currentUser?.id);
    if (currentUserId && managerIds.includes(currentUserId) && !managers.some((manager) => Number(manager.id) === currentUserId)) {
      managers.push(currentUser);
    }
    managerIds.forEach((id) => {
      if (!managers.some((manager) => Number(manager.id) === id)) {
        managers.push({ id } as User);
      }
    });
    return managers;
  }

  public onResponsibleUsersChange(userIds: number[]): void {
    this.selectedResponsibleUserIds = this.normalizeIds(userIds || []);
    this.syncResponsibleUsers();
  }

  public copyAssessmentLink(url: any) {
    this.clipboard.copy(url);
  }

  public getUserDepartments(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting[] }) {
    this.isLoading = true;
    this.departmentsService
      .departments({
        ...params,
        filter: {
          ...params?.filter,
          and: [{ patients: { id: { eq: this.fullAssessment?.patientId ?? this.patient?.id } } }],
        },
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          const page = data.departments;
          page.edges.map((departmentData: any) => {
            const _department = Convert.toDepartment(departmentData.node);
            this.departments.push(_department);
            _department.users.map((user: any) => {
              const exists = this.users.some((user1) => user1.id === user.id);
              if (!exists) this.users.push(user);
            });
          });
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: 'Unable to load departments',
          })
      );
  }

  private initializeResponsibleUsers(): void {
    this.caseAdministrators = this.buildCaseAdministratorOptions();
    if (this.isUpdate && this.fullAssessment) {
      this.selectedResponsibleUserIds = this.assessmentResponsibleUserIds();
      this.syncResponsibleUsers();
      return;
    }

    const administrators = this.caseAdministrators;
    const currentUser = JSON.parse(localStorage.getItem('user')) as User;
    const currentUserId = Number(currentUser?.id);
    if (currentUserId && administrators.some((user) => Number(user.id) === currentUserId)) {
      this.selectedResponsibleUserIds = [currentUserId];
    } else {
      const firstAdministratorId = Number(administrators[0]?.id);
      this.selectedResponsibleUserIds = firstAdministratorId ? [firstAdministratorId] : [];
    }
    this.syncResponsibleUsers();
  }

  private assessmentResponsibleUserIds(): number[] {
    const responsibleUsers = (this.fullAssessment as any)?.responsibleUsers || [];
    const ids: number[] = responsibleUsers.map((user: User) => user.id);
    if (!ids.length && this.fullAssessment?.clinicianId) ids.push(this.fullAssessment.clinicianId);
    return this.normalizeIds(ids);
  }

  private syncResponsibleUsers(): void {
    const allowedIds = this.normalizeIds(this.caseAdministrators.map((user) => user.id));
    const selectedIds = this.selectedResponsibleUserIds || [];
    const filteredIds = allowedIds.length
      ? this.normalizeIds(selectedIds).filter((id: number) => allowedIds.includes(id))
      : this.patient?.id ? [] : selectedIds;
    this.selectedResponsibleUserIds = this.normalizeIds(filteredIds);
    const primaryUser = this.primaryResponsibleUser();
    this.selectedClinician = primaryUser || this.selectedClinician;
    this.formGroup.patchValue({
      clinicianId: this.primaryResponsibleUserId(),
      responsibleUserIds: this.selectedResponsibleUserIds,
    });
  }

  private primaryResponsibleUserId(): number | undefined {
    return this.selectedResponsibleUserIds[0];
  }

  private primaryResponsibleUser(): User | undefined {
    const userId = this.primaryResponsibleUserId();
    return this.caseAdministrators.find((user) => Number(user.id) === Number(userId));
  }

  private normalizeIds(ids: Array<number | string>): number[] {
    return Array.from(
      new Set(
        (ids || [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );
  }

  public getPatient() {
    if (this.embedded) {
      if (!this.isUpdate && this.editMode && this.patient) {
        this.initializeResponsibleUsers();
        this.selectedInformant = this.patient.userId;
        this.applySelectedResponder();
      }
      return;
    }

    this.activatedRoute.queryParams.subscribe((params) => {
      if (params.profile) {
        console.log('here');
        const bytes = CryptoJS.AES.decrypt(params.profile, environment.secretKey);
        const patient = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        console.log(PatientModel.fromJson(patient));
        this.patient = PatientModel.fromJson(patient);
        this.patientEmail = this.patient.email;
        this.initializeResponsibleUsers();
        this.onSelectChange(this.typeSelected);
      }
    });
    if (this.editMode && this.patient) {
      this.initializeResponsibleUsers();
      this.selectedInformant = this.patient.userId;
      this.applySelectedResponder();
    }
  }

  public onChangeDelivery(result: Date): void {
    console.log(result?.toISOString());
  }

  public onChangeExpire(result: Date): void {
    console.log(result?.toISOString());
  }

  public onSubmitAssessment() {
    this.syncResponsibleUsers();
    if (this.formGroup.invalid) return;

    const content = this.assessmentContentPayload();
    const { informant, informantPatient, ...rest } = this.formGroup.value;
    this.applySelectedResponder();
    if (!this.primaryResponsibleUserId()) return;
    const newAssessmentData = {
      ...rest,
      ...content,
      patientId: this.fullAssessment?.patientId ?? this.patient.id,
      targetUserId: this.patient?.userId,
      clinicianId: this.primaryResponsibleUserId(),
      responsibleUserIds: this.selectedResponsibleUserIds,
    };
    newAssessmentData.dates = (newAssessmentData.dates || []).slice(0, 1).map((date: any) => ({
      ...date,
      reminderMinutes: this.parseReminderMinutes(date.reminderMinutes, date.reminderUnit),
      reminderUnit: date.reminderUnit || 'MINUTES',
    }));
    newAssessmentData.reminderMinutes = this.parseReminderMinutes(newAssessmentData.reminderMinutes, newAssessmentData.reminderUnit);
    newAssessmentData.reminderUnit = newAssessmentData.reminderUnit || 'MINUTES';
    if (this.typeSelected === `OTHER_USER` || this.typeSelected === `CASE_MANAGER`) {
      newAssessmentData.informantCaregiverRelation = null;
      newAssessmentData.informantClinicianId = newAssessmentData.responderUserId;
    }

    if (this.typeSelected === `CAREGIVER`) {
      newAssessmentData.informantClinicianId = null;
      newAssessmentData.informantCaregiverRelation =
        this.dataToSelect.find((entry: any) => entry.value === newAssessmentData.responderUserId)?.relation ?? null;
    }

    if (this.typeSelected === 'PATIENT') {
      newAssessmentData.informantClinicianId = null;
      newAssessmentData.informantCaregiverRelation = null;
    }
    if (this.fullAssessment?.patientId) {
      newAssessmentData.note = this.noteValue;
    }
    const action = this.fullAssessment?.patientId
      ? this.assessmentService.updateMongoAssessment({
          ...newAssessmentData,
          assessmentId: this.fullAssessment.id,
        })
      : this.assessmentService.createMongoAssessment(newAssessmentData);

    action.subscribe(
      () => {
        if (this.isUpdate) {
          this.nzMessage.success('Assessment updated', { nzDuration: 3000 });
        } else {
          this.nzMessage.success('Assessment created', { nzDuration: 3000 });
        }
        this.editMode = false;
        this.saved.emit();
      },
      (err) => this.errorService.handleError(err, { prefix: 'Unable to create assessment ' })
    );
  }

  public async initAssessment(): Promise<void> {
    const data = this.embedded ? null : this.activatedRoute.snapshot.queryParamMap.get('assessment');
    if (!data && !this.assessment) {
      this.formGroup.removeControl('deliveryDate');
      this.formGroup.removeControl('expirationDate');
      this.isUpdate = false;
      return;
    }

    this.isUpdate = true;
    if (this.assessment) {
      this.fullAssessment = this.assessment;
    } else {
      const bytes = CryptoJS.AES.decrypt(data, environment.secretKey);
      this.fullAssessment = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    }
    this.assessmentUrl = new URL(this.generateAssessmentURL(this.fullAssessment?.uuid), window.location.origin);
    if (!this.patient) {
      this.patient = this.fullAssessment.patient as FormattedPatient;
    }
    this.editMode = this.embedded ? this.startEditing : false;
    this.formGroup.patchValue({
      assessmentTypeId: this.fullAssessment.assessmentType?.id,
      name: this.fullAssessment.name || null,
      clinicianId: this.fullAssessment.clinician.id,
      responsibleUserIds: this.assessmentResponsibleUserIds(),
      deliveryDate: this.fullAssessment.deliveryDate,
      informantType: this.fullAssessment.informantType,
      targetUserId: this.fullAssessment.targetUserId,
      responderUserId: this.fullAssessment.responderUserId,
      reminderMinutes: this.minutesListToUnitText(this.fullAssessment.reminderMinutes || [], this.fullAssessment.reminderUnit),
      reminderUnit: this.fullAssessment.reminderUnit || 'MINUTES',
      informantPatient: this.fullAssessment.patient,
      informantClinicianId: this.fullAssessment.informantClinician?.id || null,
      informantCaregiverRelation: this.fullAssessment.informantCaregiverRelation,
      expirationDate: this.fullAssessment.expirationDate,
      note: '',
    });
    this.dates.push(
      this.formBuilder.group({
        deliveryDate: this.fullAssessment.deliveryDate,
        expirationDate: this.fullAssessment.expirationDate,
        reminderMinutes: this.minutesListToUnitText(this.fullAssessment.reminderMinutes || [], this.fullAssessment.reminderUnit),
        reminderUnit: this.fullAssessment.reminderUnit || 'MINUTES',
      })
    );
    this.selectedResponsibleUserIds = this.assessmentResponsibleUserIds();
    this.selectedClinician = this.primaryResponsibleUser() || this.fullAssessment.clinician;
    this.expireDate = this.fullAssessment.expirationDate;
    this.deliveryDate = this.fullAssessment.deliveryDate;
    this.selectedQuestionnaires = this.fullAssessment.questionnaireAssessment.questionnaires;
    this.listOfSelectedBundles = (this.fullAssessment.questionnaireAssessment as any)?.questionnaireBundles?.map(
      (bundle: any) => bundle._id
    ) || [];
    this.listOfSelectedRandomizations = (this.fullAssessment.questionnaireAssessment as any)?.randomizationRuleIds || [];
    this.assessmentContentType = this.inferAssessmentContentType();
    this.formGroup.patchValue({
      questionnaireBundles: this.selectedBundleIds(),
      randomizationRuleIds: this.selectedRandomizationRuleIds(),
    });
    this.noteValue = this.fullAssessment.note;
    this.patientEmail = this.patient.email;
    this.selectedAssessment = this.fullAssessment.assessmentType?.id;
    // this.formGroup.controls.note.disable();

    if (this.fullAssessment.informantType === 'CASE_MANAGER' || this.fullAssessment.informantType === 'OTHER_USER') {
      this.typeSelected = this.fullAssessment.informantType;
      this.selectedInformant = this.fullAssessment.targetUserId || this.fullAssessment.informantClinician?.id;
      this.dataToSelect = [
        {
          label:
            this.fullAssessment.targetUser?.firstName ||
            this.fullAssessment.informantClinician?.firstName ||
            'Selected user',
          value: this.selectedInformant,
          email: this.fullAssessment.receiverEmail,
        },
      ];
    } else if (this.fullAssessment.informantCaregiverRelation) {
      this.typeSelected = `CAREGIVER`;
      this.selectedInformant = this.fullAssessment.targetUserId;
      this.dataToSelect = [
        {
          label: this.fullAssessment.informantCaregiverRelation,
          value: this.fullAssessment.targetUserId,
          email: this.fullAssessment.receiverEmail,
          relation: this.fullAssessment.informantCaregiverRelation,
        },
      ];
    } else {
      this.typeSelected = 'PATIENT';
      this.selectedInformant = this.fullAssessment.targetUserId || this.fullAssessment.patient.userId;
      this.dataToSelect = [
        {
          label:
            this.fullAssessment.patient.firstName + ' ' + this.patient.lastName + ' ' + this.patient.medicalRecordNo,
          value: this.selectedInformant,
          email: this.fullAssessment.receiverEmail,
        },
      ];
    }
  }

  getBundles() {
    const departments = (this.patient?.departments || []).map((item) => {
      return item.id;
    });

    this.bundlesService
      .getQuestionnairesBundles({
        departmentIds: departments,
      })
      .subscribe((data: any) => {
        this.listOfBundles = data.data.getQuestionnaireBundles.edges;
      });
  }

  getRandomizations() {
    const departmentIds = this.patientDepartmentIds();
    this.randomizationsService
      .getRandomizations({
        paging: { first: 50 },
        departmentIds,
        filter: {
          type: { eq: RandomizationRuleType.LOW_LEVEL },
        },
      })
      .subscribe(
        ({ edges }) => {
          this.listOfRandomizations = edges.map((edge: any) => edge.node).filter((rule: RandomizationRule) => rule.active);
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load randomizations' })
      );
  }

  onBundleSelection(selection?: any) {
    if (selection !== undefined) {
      this.listOfSelectedBundles = selection ? [selection] : [];
    }
    this.formGroup.patchValue({ questionnaireBundles: this.selectedBundleIds() });
  }

  onRandomizationSelection(selection?: any) {
    if (selection !== undefined) {
      this.listOfSelectedRandomizations = selection ? [selection] : [];
    }
    this.formGroup.patchValue({ randomizationRuleIds: this.selectedRandomizationRuleIds() });
  }

  patientDepartmentIds(): number[] {
    return (this.patient?.departments || []).map((department: any) => department.id);
  }

  selectedBundleIds(): string[] {
    return (this.listOfSelectedBundles || [])
      .map((bundle: any) => bundle?.node?._id || bundle?._id || bundle)
      .filter((id: string) => !!id);
  }

  selectedRandomizationRuleIds(): number[] {
    return (this.listOfSelectedRandomizations || [])
      .map((randomization: any) => randomization?.id || randomization)
      .filter((id: number) => !!id);
  }

  private inferAssessmentContentType(): AssessmentContentType {
    if (this.listOfSelectedRandomizations.length) return AssessmentContentType.RANDOMIZATION;
    if (this.listOfSelectedBundles.length) return AssessmentContentType.QUESTIONNAIRE_BUNDLE;
    return AssessmentContentType.QUESTIONNAIRE;
  }

  private assessmentContentPayload(): {
    questionnaires: string[];
    questionnaireBundles: string[];
    randomizationRuleIds: number[];
  } {
    return {
      questionnaires:
        this.assessmentContentType === AssessmentContentType.QUESTIONNAIRE
          ? this.selectedQuestionnaires.slice(0, 1).map((q) => q._id)
          : [],
      questionnaireBundles:
        this.assessmentContentType === AssessmentContentType.QUESTIONNAIRE_BUNDLE
          ? this.selectedBundleIds().slice(0, 1)
          : [],
      randomizationRuleIds:
        this.assessmentContentType === AssessmentContentType.RANDOMIZATION
          ? this.selectedRandomizationRuleIds().slice(0, 1)
          : [],
    };
  }

  filterUniqueQuestionnaires(questionnaires: any) {
    const uniqueQuestionnaires = [];
    const seenIds = new Set();

    for (const questionnaire of questionnaires) {
      const id = questionnaire._id;

      // Check if the _id has been seen before
      if (!seenIds.has(id)) {
        seenIds.add(id);
        uniqueQuestionnaires.push(questionnaire);
      }
    }
    return uniqueQuestionnaires;
  }

  private getCaregivers(): void {
    this.isLoading = true;
    const options = {
      filter: {
        and: [{ patient: { id: { eq: this.fullAssessment?.patientId ?? this.patient.id } } }],
      },
    };
    this.caregiversPatientService
      .caregiversPatient(options)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((response) => {
        this.caregivers = response.data.patientCaregivers.edges
          .filter((e: any) => e.node.caregiver)
          .map((caregiver: any) => ({
            ...caregiver.node.caregiver,
            relation: caregiver.node.relation,
          }));
        this.pageInfo = response.data.patientCaregivers.pageInfo;
        if (this.typeSelected === 'CAREGIVER') {
          this.onSelectChange(this.typeSelected);
        }
      });
  }

  private getAssessmentTypes(): void {
    this.isLoading = true;
    this.assessmentAdministrationService
      .assessmentActive()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.assessmentAdministration = data.activeAssessmentTypes;
        },
        (err) => this.errorService.handleError(err, { prefix: 'Unable to load assessment type' })
      );
  }

  private generateAssessmentURL(assesmentUuid: string): string {
    const cryptoId = CryptoJS.AES.encrypt(assesmentUuid, environment.secretKey).toString();
    const tree = this.router.createUrlTree(['/assessment/overview'], { queryParams: { assessment: cryptoId } });
    return this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
  }

  private applySelectedResponder(): void {
    const responder = this.dataToSelect.find((entry: any) => entry.value === this.selectedInformant);
    this.formGroup.patchValue({
      responderUserId: this.selectedInformant,
      receiverEmail: responder?.email ?? null,
    });
    this.patientEmail = responder?.email ?? '';
  }

  private parseReminderMinutes(value: string | number[], unit = 'MINUTES'): number[] {
    if (Array.isArray(value)) {
      return value.filter((part) => Number.isFinite(part) && part >= 0);
    }
    return (value || '')
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((part) => Number.isFinite(part) && part >= 0)
      .map((part) => this.unitAmountToMinutes(part, unit));
  }

  private unitAmountToMinutes(value: number, unit = 'MINUTES'): number {
    switch (unit) {
      case 'HOURS':
        return value * 60;
      case 'DAYS':
        return value * 24 * 60;
      case 'WEEKS':
        return value * 7 * 24 * 60;
      case 'MONTHS':
        return value * 30 * 24 * 60;
      default:
        return value;
    }
  }

  private minutesToUnitAmount(minutes: number, unit = 'MINUTES'): number {
    switch (unit) {
      case 'HOURS':
        return Number(minutes || 0) / 60;
      case 'DAYS':
        return Number(minutes || 0) / (24 * 60);
      case 'WEEKS':
        return Number(minutes || 0) / (7 * 24 * 60);
      case 'MONTHS':
        return Number(minutes || 0) / (30 * 24 * 60);
      default:
        return Number(minutes || 0);
    }
  }

  private minutesListToUnitText(minutes: number[] = [], unit = 'MINUTES'): string {
    return (minutes || []).map((minute) => this.minutesToUnitAmount(minute, unit)).join(', ');
  }

  public cancelEdit(): void {
    if (this.embedded) {
      this.cancelled.emit();
      return;
    }
    this.editMode = false;
  }
}
