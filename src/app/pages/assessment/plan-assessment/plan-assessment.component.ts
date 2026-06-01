import { Component, Input, OnInit } from '@angular/core';
import { AssessmentService } from '../@services/assessment.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@env/environment';
import { QuestionnaireVersion } from '../../questionnaire-management/@types/questionnaire';
import { User } from '@app/pages/user-management/@types/user';
import { Patient } from '@app/pages/patients-management/@types/patient';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { FullAssessment } from '../@types/assessment';
import { PermissionKey } from '../../../@shared/@types/permission';
import { AppPermissionsService } from '../../../@shared/services/app-permissions.service';
import { ErrorHandlerService } from '../../../@shared/services/error-handler.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormattedPatient } from '@app/pages/patients-management/@types/formatted-patient';
import { SelectedCaregiver } from '@app/pages/patients-management/@types/caregiver';
import { PageInfo, Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { Sorting } from '@shared/@types/sorting';
import { finalize } from 'rxjs/operators';
import { Convert } from '@shared/classes/convert';
import { DepartmentsService } from '@app/pages/administration/@services/departments.service';
import { Department } from '@app/pages/administration/@types/department';
import { AssessmentAdministrationService } from '@app/pages/administration/@services/assessment-administration.service';
import { AssessmentAdministration } from '@app/pages/administration/@types/assessment-administration';
import { LocationStrategy } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { EmailTemplatesService } from '@app/pages/administration/@services/email-templates.service';
import { DEFAULT_PAGE_SIZE } from '@app/@shared/@modules/master-data/@types/list';
import { QuestionnaireBundlesService } from '@app/pages/questionnaire-management/@services/questionnaire-bundles.service';
import { RolesService } from '@app/pages/administration/@services/roles.service';
import { Role } from '@app/pages/administration/@types/role';
import { UsersService } from '@app/pages/user-management/@services/users.service';
import { CaregiversPatientService } from '@app/pages/patients-management/@services/caregivers-patient.service';
import { RandomizationsService } from '@app/pages/randomizations/@services/randomizations.service';
import { RandomizationRule, RandomizationRuleType } from '@app/pages/randomizations/@types/randomization';

const CryptoJS = require('crypto-js');

enum AssessmentContentType {
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  QUESTIONNAIRE_BUNDLE = 'QUESTIONNAIRE_BUNDLE',
  RANDOMIZATION = 'RANDOMIZATION',
}

@Component({
  selector: 'app-plan-assessment',
  templateUrl: './plan-assessment.component.html',
  styleUrls: ['./plan-assessment.component.scss'],
})
export class PlanAssessmentComponent implements OnInit {
  public PK = PermissionKey;
  public selectedQuestionnaires: QuestionnaireVersion[] = [];
  public selectedAssessment: any = null;
  listOfBundles: any = [];
  listOfSelectedBundles: any = [];
  listOfRandomizations: RandomizationRule[] = [];
  listOfSelectedRandomizations: number[] = [];
  public assessmentContentType = AssessmentContentType.QUESTIONNAIRE;
  public ACT = AssessmentContentType;
  public typeSelected: any = 'PATIENT';
  public dataToSelect: any = [];
  public users: User[] = [];
  public assessmentUrl: URL;
  public data: Partial<AssessmentAdministration>[];
  public pageInfo: PageInfo;
  public selectedPatient: Patient;
  public selectedTargetUser: User;
  public targetType: 'patient' | 'user' = 'patient';
  public roles: Role[] = [];
  public availableRoles: Role[] = [];
  public targetRoleCode = 'PATIENT';
  public responderRoleCode = 'PATIENT';
  public targetUsers: User[] = [];
  public responderOptions: Array<{ label: string; value: number; email?: string; relation?: string }> = [];
  @Input() public patient: FormattedPatient;
  @Input() public caregivers: SelectedCaregiver[] = [];
  public selectedInformant: any = null;
  public selectedClinician: User;
  public fullAssessment: FullAssessment;
  public assessmentForm: FormGroup;
  public editMode = true;
  public isLoading = false;
  public departments: Department[] = [];
  public contentTargetMessage = 'Seleccione primero un paciente o usuario para cargar el contenido disponible.';
  public emailTemplates: any[] = [];
  public emailTemplatesRequestOptions: { paging: Paging; filter: Filter; sorting: Sorting[] } = {
    paging: { first: DEFAULT_PAGE_SIZE },
    filter: {},
    sorting: [],
  };
  public deliveryDate: any = null;
  public expireDate: any = null;
  public maxLength = 200;
  public checked = false;
  public isUpdate: boolean;
  public hasEmail = false;
  url: any = '';
  options = [
    {
      label: 'Mother',
      value: 'Mother',
    },
    {
      label: 'Father',
      value: 'Father',
    },
    {
      label: 'Grandparent',
      value: 'Grandparent',
    },
    {
      label: 'Uncle/Aunt',
      value: 'Uncle/Aunt',
    },
    {
      label: 'Extended Family',
      value: 'Extended Family',
    },
    {
      label: 'Legal Guardian',
      value: 'Legal Guardian',
    },
    {
      label: 'Family Doctor',
      value: 'Family Doctor',
    },
    {
      label: 'External Paediatrician',
      value: 'External Paediatrician',
    },
    {
      label: 'External Psychotherapist',
      value: 'External Psychotherapist',
    },
    {
      label: 'External Psychologist',
      value: 'External Psychologist',
    },
    {
      label: 'External Social Worker',
      value: 'External Social Worker',
    },
    {
      label: 'External Nurse',
      value: 'External Nurse',
    },
    {
      label: 'Emergency Department',
      value: 'Emergency Department',
    },
    {
      label: 'Friend',
      value: 'Friend',
    },
    {
      label: 'Neighbour',
      value: 'Neighbour',
    },
    {
      label: 'Teacher',
      value: 'Teacher',
    },
    {
      label: 'School Representative',
      value: 'School Representative',
    },
    {
      label: 'Advisor',
      value: 'Advisor',
    },
    {
      label: 'Legal Advisor',
      value: 'Legal Advisor',
    },
    {
      label: 'Assistance',
      value: 'Assistance',
    },
    {
      label: 'Supervisor',
      value: 'Supervisor',
    },
    {
      label: 'Other',
      value: 'Other',
    },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private assessmentService: AssessmentService,
    private nzMessage: NzMessageService,
    private errorService: ErrorHandlerService,
    private activatedRoute: ActivatedRoute,
    private emailTemplatesService: EmailTemplatesService,
    private bundlesService: QuestionnaireBundlesService,
    private departmentsService: DepartmentsService,
    private assessmentAdministrationService: AssessmentAdministrationService,
    private rolesService: RolesService,
    private usersService: UsersService,
    private caregiversPatientService: CaregiversPatientService,
    private randomizationsService: RandomizationsService,
    public perms: AppPermissionsService,
    private router: Router,
    private locationStrategy: LocationStrategy,
    private clipboard: Clipboard
  ) {}

  public ngOnInit(): void {
    this.getAssessmentTypes();
    this.getRoles();
    this.initAssessment();
    this.userAutoSelect();
    this.hasEmail = environment.email;
  }

  get datesFieldAsFormArray(): FormArray {
    return this.assessmentForm.get('dates') as FormArray;
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

  public onSelectChange(event: any) {
    if (!this.editMode) {
      return;
    }
    this.responderRoleCode = event;
    this.typeSelected = event;
    this.clearResponderSelection();
    this.populateResponderOptions();
  }

  public userAutoSelect() {
    const userLocalStorage = JSON.parse(localStorage.getItem('user')) as User;
    this.selectedClinician = userLocalStorage;
  }

  public onSubmitAssessment() {
    if (this.assessmentForm.invalid) return;
    const content = this.assessmentContentPayload();
    const { informant, informantPatient, ...rest } = this.assessmentForm.value;
    this.applySelectedResponder();
    const newAssessmentData = {
      ...rest,
      ...content,
    };
    newAssessmentData.dates = (newAssessmentData.dates || []).map((date: any) => ({
      ...date,
      reminderMinutes: this.parseReminderMinutes(date.reminderMinutes),
    }));
    newAssessmentData.reminderMinutes = this.parseReminderMinutes(newAssessmentData.reminderMinutes);

    if (this.responderRoleCode !== `CAREGIVER`) {
      newAssessmentData.informantCaregiverRelation = null;
    }

    if (this.responderRoleCode === `CAREGIVER`) {
      newAssessmentData.informantClinicianId = null;
      newAssessmentData.informantCaregiverRelation =
        this.responderOptions.find((entry) => entry.value === newAssessmentData.responderUserId)?.relation ?? null;
    }

    if (this.responderRoleCode === 'PATIENT') {
      newAssessmentData.informantClinicianId = null;
      newAssessmentData.informantCaregiverRelation = null;
    } else if (this.responderRoleCode !== 'CAREGIVER') {
      newAssessmentData.informantClinicianId = newAssessmentData.responderUserId;
    }

    const action = this.fullAssessment?.id
      ? this.assessmentService.updateMongoAssessment({
          ...newAssessmentData,
          assessmentId: this.fullAssessment.id,
        })
      : this.assessmentService.createMongoAssessment(newAssessmentData);

    action.subscribe(
      () => {
        this.nzMessage.success('Assessment created', { nzDuration: 3000 });
        this.editMode = false;
        this.router.navigate(['/psira/assessments/planned-assessments']);
      },
      (err) => this.errorService.handleError(err, { prefix: 'Unable to create assessment ' })
    );
  }

  public onQuestionnaireSelected(questionnaires: QuestionnaireVersion[]): void {
    this.selectedQuestionnaires = questionnaires;
    this.assessmentForm.patchValue({ questionnaires });
  }

  public onAssessmentContentTypeChange(type: AssessmentContentType): void {
    this.assessmentContentType = type;
    if (type !== AssessmentContentType.QUESTIONNAIRE) this.selectedQuestionnaires = [];
    if (type !== AssessmentContentType.QUESTIONNAIRE_BUNDLE) this.listOfSelectedBundles = [];
    if (type !== AssessmentContentType.RANDOMIZATION) this.listOfSelectedRandomizations = [];
    this.assessmentForm.patchValue({
      questionnaires: this.selectedQuestionnaires,
      questionnaireBundles: this.selectedBundleIds(),
      randomizationRuleIds: this.selectedRandomizationRuleIds(),
    });
  }

  public onUserSelect(user: User) {
    this.assessmentForm.patchValue({
      clinicianId: user?.id,
    });
  }

  public onTargetUserSelect(user: User) {
    this.selectedTargetUser = user;
    this.assessmentForm.patchValue({
      targetUserId: user?.id,
    });
    this.defaultResponderToTargetRole();
    this.populateResponderOptions();
    this.departments = user?.departments || [];
    this.clearAssessmentContent();
    this.loadContentOptions();
  }

  public onTargetRoleChange(roleCode: string): void {
    this.targetRoleCode = roleCode;
    this.targetType = roleCode === 'PATIENT' ? 'patient' : 'user';
    this.selectedPatient = null;
    this.selectedTargetUser = null;
    this.patient = null;
    this.caregivers = [];
    this.users = [];
    this.targetUsers = [];
    this.responderOptions = [];
    this.selectedInformant = null;
    this.departments = [];
    this.clearAssessmentContent();
    this.defaultResponderToTargetRole();
    this.assessmentForm.patchValue({
      patientId: null,
      targetUserId: null,
      responderUserId: null,
      receiverEmail: null,
    });

    if (this.targetType === 'patient') {
      this.assessmentForm.get('patientId').setValidators(Validators.required);
    } else {
      this.assessmentForm.get('patientId').clearValidators();
    }
    this.assessmentForm.get('targetUserId').setValidators(Validators.required);
    this.assessmentForm.get('patientId').updateValueAndValidity();
    this.assessmentForm.get('targetUserId').updateValueAndValidity();

    if (this.targetType === 'user') {
      const currentUser = JSON.parse(localStorage.getItem('user')) as User;
      if (currentUser?.roles?.some((role) => role.code === roleCode)) {
        this.targetUsers = [currentUser];
      }
    }
  }

  public searchTargetUsers(search: string): void {
    if (!search || this.targetRoleCode === 'PATIENT') return;

    this.usersService
      .getUsers({
        filter: {
          and: [
            { roles: { code: { eq: this.targetRoleCode } } },
            { or: this.createUserSearchFilter(search) },
          ],
        },
      })
      .subscribe(
        ({ data }: any) => {
          this.targetUsers = data.users.edges.map((edge: any) => edge.node);
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load users' })
      );
  }

  public onTargetUserOptionSelect(userId: number): void {
    const user = this.targetUsers.find((entry) => entry.id === userId);
    if (!user) return;

    this.selectedTargetUser = user;
    this.assessmentForm.patchValue({
      patientId: null,
      targetUserId: user.id,
    });
    this.defaultResponderToTargetRole();
    this.populateResponderOptions();
    this.departments = user.departments || [];
    this.clearAssessmentContent();
    this.loadContentOptions();
  }

  public onTargetTypeChange(type: 'patient' | 'user') {
    this.targetType = type;
    if (type === 'patient') {
      this.assessmentForm.get('patientId').setValidators(Validators.required);
      this.assessmentForm.get('targetUserId').setValidators(Validators.required);
      this.selectedTargetUser = null;
    } else {
      this.assessmentForm.get('targetUserId').setValidators(Validators.required);
      this.assessmentForm.get('patientId').clearValidators();
      this.assessmentForm.get('patientId').setValue(null);
      this.selectedPatient = null;
    }
    this.assessmentForm.get('patientId').updateValueAndValidity();
    this.assessmentForm.get('targetUserId').updateValueAndValidity();
  }

  public onPatientSelect(patient: Patient) {
    this.patient = patient;
    this.selectedPatient = patient;
    this.assessmentForm.patchValue({
      patientId: patient?.id,
      targetUserId: patient?.userId,
    });
    this.defaultResponderToTargetRole();
    this.users = [];
    this.clearAssessmentContent();

    if (this.fullAssessment?.patientId || this.patient?.id) {
      this.getUserDepartments({
        filter: { and: [{ patients: { id: { eq: this.fullAssessment?.patientId ?? this.patient?.id } } }] },
      });
      this.getCaregivers(this.fullAssessment?.patientId ?? this.patient?.id);
      this.populateResponderOptions();
    }

    this.emailTemplates = [];
    this.getPatientEmailTemplates(this.fullAssessment?.patientId || this.patient?.id);
  }

  goBack() {
    this.router.navigate(['/psira/assessments/planned-assessments']);
  }

  public onChangeDelivery(result: Date): void {
    console.log(result?.toISOString());
  }

  public onChangeExpire(result: Date): void {
    console.log(result?.toISOString());
  }

  public getUserDepartments(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting[] }) {
    this.isLoading = true;
    this.departmentsService
      .departments(params)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          const page = data.departments;
          this.departments = [];
          page.edges.map((departmentData: any) => {
            const _department = Convert.toDepartment(departmentData.node);
            this.departments.push(_department);
            _department.users.map((user: any) => {
              const exists = this.users.some((user1) => user1.id === user.id);
              if (!exists) this.users.push(user);
            });
          });

          this.loadContentOptions();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load departments' })
      );
  }

  getPatientEmailTemplates(id: number) {
    this.emailTemplatesService.getPatientEmailTemplates(id).subscribe((data: any) => {
      this.emailTemplates = data?.data?.getPatientEmailTemplates;
      if (this.editMode === true) {
        this.assessmentForm.patchValue({ mailTemplateId: this.emailTemplates[0]?.id });
      }
    });
  }

  getBundles() {
    if (!this.hasContentTarget()) {
      this.listOfBundles = [];
      return;
    }
    const departmentIds = this.departments.map((el) => el.id);
    this.bundlesService.getQuestionnairesBundles({ departmentIds }).subscribe((data: any) => {
      this.listOfBundles = data.data.getQuestionnaireBundles.edges;
    });
  }

  getRandomizations() {
    if (!this.hasContentTarget()) {
      this.listOfRandomizations = [];
      return;
    }
    const departmentIds = this.departments.map((el) => el.id);
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
    this.assessmentForm.patchValue({ questionnaireBundles: this.selectedBundleIds() });
  }

  onRandomizationSelection(selection?: any) {
    if (selection !== undefined) {
      this.listOfSelectedRandomizations = selection ? [selection] : [];
    }
    this.assessmentForm.patchValue({ randomizationRuleIds: this.selectedRandomizationRuleIds() });
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

  get dates(): FormArray {
    return this.assessmentForm.get('dates') as FormArray;
  }

  public applySelectedResponder(userId: number = this.selectedInformant): void {
    this.selectedInformant = userId;
    const responder = this.responderOptions.find((entry: any) => entry.value === userId);
    if (!responder) {
      this.assessmentForm.patchValue({ responderUserId: null, receiverEmail: null });
      return;
    }
    this.assessmentForm.patchValue({
      responderUserId: userId,
      receiverEmail: responder.email ?? null,
    });
  }

  // tslint:disable
  public copyAssessmentLink(url: any) {
    this.clipboard.copy(url);
  }

  private initAssessment() {
    let assessmentId: number;

    try {
      const raw = this.activatedRoute.snapshot.queryParamMap.get('assessment');
      const bytes = CryptoJS.AES.decrypt(raw, environment.secretKey);
      assessmentId = JSON.parse(bytes.toString(CryptoJS.enc.Utf8)).id;

      this.isUpdate = true;

      this.assessmentForm = this.formBuilder.group({
        assessmentTypeId: [null, Validators.required],
        patientId: [null, Validators.required],
        targetUserId: [null],
        responderUserId: [null, Validators.required],
        clinicianId: [null, Validators.required],
        questionnaires: [[]],
        questionnaireBundles: [[]],
        randomizationRuleIds: [[]],
        informantType: [null],
        informantPatient: [null],
        informantClinicianId: [null],
        informantCaregiverRelation: [null],
        emailReminder: [null],
        receiverEmail: [null],
        mailTemplateId: [null],
        reminderMinutes: [''],
        deliveryDate: [null],
        expirationDate: [null],
        dates: this.formBuilder.array([]),
        note: [null],
      });
    } catch {
      this.assessmentForm = this.formBuilder.group({
        assessmentTypeId: [null, Validators.required],
        patientId: [null, Validators.required],
        targetUserId: [null],
        responderUserId: [null, Validators.required],
        clinicianId: [null, Validators.required],
        questionnaires: [[]],
        questionnaireBundles: [[]],
        randomizationRuleIds: [[]],
        informantType: [null],
        informantPatient: [null],
        informantClinicianId: [null],
        informantCaregiverRelation: [null],
        emailReminder: [null],
        receiverEmail: [null],
        mailTemplateId: [null],
        reminderMinutes: [''],
        dates: this.formBuilder.array([
          this.formBuilder.group({
            expirationDate: [null],
            deliveryDate: [null],
            reminderMinutes: [''],
          }),
        ]),
        note: [null],
      });
      this.isUpdate = false;
      return;
    }

    this.assessmentService.getFullAssessment(assessmentId).subscribe(
      (assessment) => {
        this.editMode = false;
        this.fullAssessment = assessment;
        this.assessmentUrl = new URL(this.generateAssessmentURL(this.fullAssessment?.uuid), window.location.origin);
        if (this.fullAssessment.targetUserId) {
          this.onTargetRoleChange(this.fullAssessment.patientId ? 'PATIENT' : this.fullAssessment.targetUser?.roles?.[0]?.code ?? 'PATIENT');
          this.selectedTargetUser = this.fullAssessment.targetUser;
        } else {
          this.onTargetRoleChange('PATIENT');
          this.selectedPatient = this.fullAssessment.patient;
        }
        this.assessmentForm.patchValue({
          emailReminder: this.fullAssessment.emailReminder,
          assessmentTypeId: {
            label: this.fullAssessment.assessmentType?.name,
            value: this.fullAssessment.assessmentType?.id,
          },
          informantType: this.fullAssessment.informantType,
          patientId: this.fullAssessment.patientId,
          targetUserId: this.fullAssessment.targetUserId,
          responderUserId: this.fullAssessment.responderUserId,
          clinicianId: this.fullAssessment.clinicianId,
          informantPatient: this.fullAssessment.patient,
          informantClinicianId: this.fullAssessment.informantClinician?.id || null,
          informantCaregiverRelation: this.fullAssessment.informantCaregiverRelation,
          deliveryDate: this.fullAssessment.deliveryDate,
          expirationDate: this.fullAssessment.expirationDate,
          receiverEmail: this.fullAssessment.receiverEmail,
          mailTemplateId: this.fullAssessment.mailTemplateId,
          reminderMinutes: (this.fullAssessment.reminderMinutes || []).join(', '),
          note: this.fullAssessment.note,
          questionnaires: this.fullAssessment.questionnaireAssessment?.questionnaires,
          questionnaireBundles: (this.fullAssessment.questionnaireAssessment as any)?.questionnaireBundles?.map(
            (bundle: any) => bundle._id
          ) || [],
          randomizationRuleIds: (this.fullAssessment.questionnaireAssessment as any)?.randomizationRuleIds || [],
        });
        // @ts-ignore
        this.dates.push(
          this.formBuilder.group({
            deliveryDate: this.fullAssessment.deliveryDate,
            expirationDate: this.fullAssessment.expirationDate,
            reminderMinutes: (this.fullAssessment.reminderMinutes || []).join(', '),
          })
        );

        this.selectedQuestionnaires = this.fullAssessment.questionnaireAssessment?.questionnaires;
        this.listOfSelectedBundles = (this.fullAssessment.questionnaireAssessment as any)?.questionnaireBundles?.map(
          (bundle: any) => bundle._id
        ) || [];
        this.listOfSelectedRandomizations = (this.fullAssessment.questionnaireAssessment as any)?.randomizationRuleIds || [];
        this.assessmentContentType = this.inferAssessmentContentType();
        this.selectedPatient = this.fullAssessment.patient;
        this.selectedClinician = this.fullAssessment.clinician;
        this.fullAssessment = this.fullAssessment;
        this.patient = this.fullAssessment.patient;
        this.departments = this.fullAssessment.patientId
          ? (this.fullAssessment.patient?.departments || [])
          : (this.fullAssessment.targetUser?.departments || []);
        this.loadContentOptions();
        this.selectedAssessment = this.fullAssessment.assessmentType?.id;
        this.targetRoleCode = this.fullAssessment.patientId ? 'PATIENT' : this.fullAssessment.targetUser?.roles?.[0]?.code ?? 'PATIENT';
        this.responderRoleCode = this.fullAssessment.informantType || 'PATIENT';
        this.typeSelected = this.responderRoleCode;
        if (this.fullAssessment.informantClinician) {
          this.selectedInformant = this.fullAssessment.informantClinician.id;
          this.dataToSelect = [
            {
              label: this.fullAssessment.informantClinician.firstName,
              value: this.fullAssessment.informantClinician.id,
            },
          ];
        } else if (this.fullAssessment.informantCaregiverRelation) {
          this.selectedInformant = this.fullAssessment.informantCaregiverRelation;
          this.dataToSelect = [
            {
              label: this.fullAssessment.informantCaregiverRelation,
              value: this.fullAssessment.informantCaregiverRelation,
            },
          ];
        } else {
          this.selectedInformant = this.fullAssessment.patient.id;
          this.dataToSelect = [
            {
              label:
                this.fullAssessment.patient.firstName +
                ' ' +
                this.patient.lastName +
                ' ' +
                this.patient.medicalRecordNo,
              value: this.fullAssessment.patient.id,
            },
          ];
        }
      },
      (error) =>
        this.errorService.handleError(error, { prefix: `Unable to load the assessment with ID "${assessmentId}"` })
    );
  }

  private clearResponderSelection(): void {
    this.selectedInformant = null;
    this.responderOptions = [];
    this.assessmentForm.patchValue({
      responderUserId: null,
      receiverEmail: null,
    });
  }

  private defaultResponderToTargetRole(): void {
    this.responderRoleCode = this.targetRoleCode;
    this.typeSelected = this.targetRoleCode;
    this.assessmentForm.patchValue({ informantType: this.targetRoleCode });
    this.clearResponderSelection();
  }

  private getRoles(): void {
    const currentUser = JSON.parse(localStorage.getItem('user')) as User;
    const currentHierarchy = Math.min(...(currentUser?.roles ?? []).map((role) => role.hierarchy));
    const canAssignAnyAssessmentUser =
      currentUser?.isSuperUser ||
      currentUser?.roles?.some((role) => role.isSuperAdmin || role.code === 'SUPER_ADMIN') ||
      currentUser?.permissions?.some((permission) => permission.name === PermissionKey.ASSIGN_ANY_ASSESSMENT_USER) ||
      currentUser?.roles?.some((role) =>
        role.permissions?.some((permission) => permission.name === PermissionKey.ASSIGN_ANY_ASSESSMENT_USER)
      );

    this.rolesService.roles({ paging: { first: 50 } }).subscribe(
      ({ data }: any) => {
        this.roles = data.roles.edges.map((edge: any) => edge.node);
        this.availableRoles = this.roles
          .filter((role) => canAssignAnyAssessmentUser || role.hierarchy > currentHierarchy)
          .sort((a, b) => a.hierarchy - b.hierarchy);

        const defaultRole = this.availableRoles.find((role) => role.code === 'PATIENT') ?? this.availableRoles[0];
        if (defaultRole && !this.availableRoles.some((role) => role.code === this.targetRoleCode)) {
          this.targetRoleCode = defaultRole.code;
          this.responderRoleCode = defaultRole.code;
          this.typeSelected = defaultRole.code;
          this.onTargetRoleChange(defaultRole.code);
        }
      },
      (error) => this.errorService.handleError(error, { prefix: 'Unable to load roles' })
    );
  }

  private getCaregivers(patientId: number): void {
    this.caregiversPatientService
      .caregiversPatient({
        filter: { and: [{ patient: { id: { eq: patientId } } }] },
      })
      .subscribe(
        ({ data }: any) => {
          this.caregivers = data.patientCaregivers.edges
            .filter((edge: any) => edge.node.caregiver?.userId)
            .map((edge: any) => ({
              ...edge.node.caregiver,
              relation: edge.node.relation,
            }));
          if (this.responderRoleCode === 'CAREGIVER') {
            this.populateResponderOptions();
          }
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load caregivers' })
      );
  }

  private populateResponderOptions(): void {
    const targetUserId = this.targetRoleCode === 'PATIENT' ? this.selectedPatient?.userId : this.selectedTargetUser?.id;
    const targetEmail = this.targetRoleCode === 'PATIENT' ? this.selectedPatient?.email : this.selectedTargetUser?.email;

    if (this.responderRoleCode === this.targetRoleCode && targetUserId) {
      this.responderOptions = [
        {
          label:
            this.targetRoleCode === 'PATIENT'
              ? [this.selectedPatient?.firstName, this.selectedPatient?.lastName].filter(Boolean).join(' ')
              : [this.selectedTargetUser?.firstName, this.selectedTargetUser?.lastName].filter(Boolean).join(' '),
          value: targetUserId,
          email: targetEmail,
        },
      ];
      this.selectedInformant = targetUserId;
      this.applySelectedResponder();
      return;
    }

    if (this.responderRoleCode === 'CAREGIVER' && this.targetRoleCode === 'PATIENT') {
      this.responderOptions = this.caregivers.map((caregiver) => ({
        label: [caregiver.firstName, caregiver.lastName, caregiver.relation ? `(${caregiver.relation})` : null]
          .filter(Boolean)
          .join(' '),
        value: caregiver.userId as number,
        email: caregiver.email,
        relation: caregiver.relation,
      }));
      this.selectedInformant = this.responderOptions.length ? this.responderOptions[0].value : null;
      this.applySelectedResponder();
      return;
    }

    if (this.targetRoleCode === 'PATIENT' && this.selectedPatient?.id) {
      this.loadDepartmentResponders(this.selectedPatient.id, this.responderRoleCode);
    } else if (this.selectedTargetUser?.departments?.length) {
      this.loadDepartmentUserResponders(
        this.selectedTargetUser.departments.map((department) => department.id),
        this.responderRoleCode
      );
    } else {
      this.responderOptions = [];
      this.selectedInformant = null;
      this.assessmentForm.patchValue({ responderUserId: null, receiverEmail: null });
    }
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
          ? this.selectedQuestionnaires.map((q) => q._id)
          : [],
      questionnaireBundles:
        this.assessmentContentType === AssessmentContentType.QUESTIONNAIRE_BUNDLE
          ? this.selectedBundleIds()
          : [],
      randomizationRuleIds:
        this.assessmentContentType === AssessmentContentType.RANDOMIZATION
          ? this.selectedRandomizationRuleIds()
          : [],
    };
  }

  public hasContentTarget(): boolean {
    return !!(this.selectedPatient?.id || this.selectedTargetUser?.id || this.fullAssessment?.id);
  }

  public targetDepartmentIds(): number[] {
    return (this.departments || []).map((department) => department.id);
  }

  private loadContentOptions(): void {
    if (!this.hasContentTarget()) {
      this.listOfBundles = [];
      this.listOfRandomizations = [];
      return;
    }
    this.getBundles();
    this.getRandomizations();
  }

  private clearAssessmentContent(): void {
    this.selectedQuestionnaires = [];
    this.listOfSelectedBundles = [];
    this.listOfSelectedRandomizations = [];
    this.assessmentForm.patchValue({
      questionnaires: [],
      questionnaireBundles: [],
      randomizationRuleIds: [],
    });
  }

  private loadDepartmentResponders(patientId: number, roleCode: string): void {
    this.departmentsService
      .departments({ filter: { and: [{ patients: { id: { eq: patientId } } }] } })
      .subscribe(({ data }: any) => {
        const departmentIds = data.departments.edges.map((edge: any) => edge.node.id);
        this.loadDepartmentUserResponders(departmentIds, roleCode);
      });
  }

  private loadDepartmentUserResponders(departmentIds: number[], roleCode: string): void {
    this.usersService
      .getUsers({
        filter: {
          and: [{ departments: { id: { in: departmentIds } } }, { roles: { code: { eq: roleCode } } }],
        },
      })
      .subscribe(
        ({ data }: any) => {
          this.responderOptions = data.users.edges.map((edge: any) => ({
            label: [edge.node.firstName, edge.node.lastName].filter(Boolean).join(' '),
            value: edge.node.id,
            email: edge.node.email,
          }));
          this.selectedInformant = this.responderOptions.length ? this.responderOptions[0].value : null;
          this.applySelectedResponder();
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load responders' })
      );
  }

  private createUserSearchFilter(searchString: string) {
    const keyword = `%${searchString}%`;
    return [
      { firstName: { iLike: keyword } },
      { middleName: { iLike: keyword } },
      { lastName: { iLike: keyword } },
      { username: { iLike: keyword } },
      { email: { iLike: keyword } },
    ];
  }

  private generateAssessmentURL(assesmentUuid: string): string {
    const cryptoId = CryptoJS.AES.encrypt(assesmentUuid, environment.secretKey).toString();
    const tree = this.router.createUrlTree(['/assessment/overview'], { queryParams: { assessment: cryptoId } });
    return this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
  }

  private getAssessmentTypes(): void {
    this.isLoading = true;
    this.assessmentAdministrationService
      .assessmentActive()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.data = data.activeAssessmentTypes;
        },
        (err) => this.errorService.handleError(err, { prefix: 'Unable to load assessment type' })
      );
  }

  private parseReminderMinutes(value: string | number[]): number[] {
    if (Array.isArray(value)) {
      return value.filter((part) => Number.isFinite(part) && part >= 0);
    }
    return (value || '')
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((part) => Number.isFinite(part) && part >= 0);
  }
}
