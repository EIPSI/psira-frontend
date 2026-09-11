import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { userForms } from '@app/pages/user-management/@forms/user.form';
import { Form } from '@shared/components/form/@types/form';
import { CreateOneUserInput, CreateUserInput, UpdateOneUserInput, User } from '@app/pages/user-management/@types/user';
import { UsersService } from '@app/pages/user-management/@services/users.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '@env/environment';
import { UserUpdatePasswordInput } from './user-update-password.type';
import { Sorting } from '@shared/@types/sorting';
import { Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { RolesService } from '@app/pages/administration/@services/roles.service';
import { Convert } from '@shared/classes/convert';
import { Role } from '@app/pages/administration/@types/role';
import { DepartmentsService } from '@app/pages/administration/@services/departments.service';
import { Department } from '@app/pages/administration/@types/department';
import { ModalType } from '@app/pages/user-management/users-list/modal.type';
import { FormComponent } from '@shared/components/form/form.component';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { UserModel } from '@app/pages/user-management/@models/user.model';
import { PermissionKey } from '@app/@shared/@types/permission';
import { DeleteOneInput } from '../../../@shared/@types/delete-one-input';
import { ErrorHandlerService } from '../../../@shared/services/error-handler.service';
import { finalize } from 'rxjs/operators';
import { NzModalService } from 'ng-zorro-antd/modal';
import { EvaluationAutomationsService } from '@app/pages/evaluation-automations/@services/evaluation-automations.service';
import { EvaluationAutomationTriggerPointLabel } from '@app/pages/evaluation-automations/@types/evaluation-automation';
import { AuthService } from '@app/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { encryptRoutePayload, decryptRoutePayload } from '@app/@shared/utils/route-crypto.util';


@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent implements OnInit {
  @Input() section: 'all' | 'profile' | 'settings' = 'all';
  @Input() showTitle = true;
  @Input() userOverride?: User;
  @Input() roleCodeOverride?: string;
  @ViewChild(FormComponent) _child: FormComponent;
  PK = PermissionKey;
  user: User;
  isLoading = false;
  showModal = false;
  populateForm = false;
  resetForm = false;
  modalType: ModalType;
  updatePasswordForm: Form = userForms.updateUserPassword;
  changePasswordModal: ModalType = {
    title: 'userManagement.changePassword',
    type: 'changePassword',
  };
  newMode = false;
  loadingMessage = '';
  profileFields: Form = userForms.userProfileEdit;
  userRolesPermissionsFields: Form = userForms.userRolesPermissions;
  updateUserPasswordFields: Form = userForms.updateUserPassword;
  tabSub: any;
  routeSub: any;
  tabIndexSub: any;
  inputMode = true;
  showCancelButton = false;
  roles: Role[] = [];
  departments: Department[] = [];
  selectedRoles: number[] = [];
  unselectedRoles: number[] = [];
  selectedDepartments: number[] = [];
  unselectedDepartments: number[];
  currentUser: User;
  assignmentLoading = false;
  selectedSupervisorId: number;
  selectedTherapistId: number;
  availableSupervisors: User[] = [];
  availableTherapists: User[] = [];
  assignedSupervisors: User[] = [];
  assignedTherapists: User[] = [];
  public defaultRoleCode: string;
  public automationPreview: any[] = [];
  public automationPreviewLoading = false;
  public skippedAutomationIds: number[] = [];
  public triggerPointLabel: any = EvaluationAutomationTriggerPointLabel;
  private particularDepartment?: Department;
  private previewRoleIds: number[] = [];
  private previewDepartmentIds: number[] = [];

  get userTitle(): string {
    const name = [this.user?.firstName, this.user?.middleName, this.user?.lastName].filter((s) => !!s).join(' ');
    return [this.user?.workID, name].filter((s) => !!s).join(' - ');
  }

  get userDisplayName(): string {
    const name = [this.user?.firstName, this.user?.middleName, this.user?.lastName].filter((s) => !!s).join(' ');
    return name || this.user?.email || this.user?.username || '';
  }

  get isOwnUserProfile(): boolean {
    return !!this.user?.id && !!this.currentUser?.id && Number(this.user.id) === Number(this.currentUser.id);
  }

  constructor(
    private modalService: NzModalService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    private rolesService: RolesService,
    public perms: AppPermissionsService,
    private departmentsService: DepartmentsService,
    private evaluationAutomationsService: EvaluationAutomationsService,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    if (this.userOverride) {
      this.defaultRoleCode = this.roleCodeOverride || this.userOverride.roles?.[0]?.code;
      this.user = this.withProfileRelations({ ...this.userOverride });
      if (this.user.birthDate) this.user.birthDate = String(this.user.birthDate).slice(0, 10) as any;
      this.newMode = false;
      this.inputMode = false;
      this.showCancelButton = true;
      this.profileFields = userForms.userProfileEdit;
      this.populateForm = true;
    } else {
      this.getUserFromUrl();
    }
    this.getUser();
    if (this.shouldLoadProfileOptions()) {
      this.getRoles({ paging: { first: 50 } });
      this.getDepartments({ paging: { first: 50 } });
      this.getParticularDepartment();
    }
  }

  private shouldLoadProfileOptions(): boolean {
    if (this.section === 'settings') return false;
    return this.perms.permissionsOnly([
      PermissionKey.USERS_EDIT_DEPARTMENT,
      PermissionKey.ROLES_VIEW_ALL,
      PermissionKey.ROLES_EDIT_ALL,
      PermissionKey.SETTINGS_VIEW_ALL,
      PermissionKey.SETTINGS_EDIT_ALL,
    ]);
  }

  getDepartments(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting[] }) {
    this.isLoading = true;
    this.departmentsService
      .departments(params)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }: any) => {
          const page = data.departments;
          const departments = page.edges.map((departmentData: any) => Convert.toDepartment(departmentData.node));
          this.particularDepartment = departments.find((department: Department) => department.name === 'Particular');
          this.departments = departments;
          this.updateDepartmentFieldForSelectedRoles();
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('departments.unableLoadDepartments'),
          })
      );
  }

  getParticularDepartment(): void {
    this.departmentsService
      .departments({
        paging: { first: 1 },
        filter: { name: { eq: 'Particular' } } as any,
      })
      .subscribe(
        ({ data }: any) => {
          this.particularDepartment = data.departments.edges.map((edge: any) => Convert.toDepartment(edge.node))[0];
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('departments.unableLoadParticularDepartment'),
          })
      );
  }

  getUser() {
    this.currentUser = JSON.parse(localStorage.getItem('user')) as User;
  }

  clickChangePassword() {
    this._child.handleSubmitForm(this.updatePasswordForm);
  }

  showChangePasswordForm() {
    this.showModal = true;
    this.modalType = Object.assign({}, this.changePasswordModal);
    this.modalType.title = this.translate.instant('userManagement.changePasswordForUser', {
      username: this.user.username,
      name: this.formatFullName(this.user),
    });
  }

  getRoles(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting }) {
    const options: any = [];
    this.roles = [];
    this.rolesService.roles(params).subscribe(
      ({ data }: any) => {
        data.roles.edges.map((role: any) => {
          const _role = Convert.toRole(role.node);
          this.roles.push(_role);
          options.push({ label: _role.name, value: _role.id });
        });
        this.userRolesPermissionsFields.groups[0].fields[0].options = options;
        this.profileFields.groups.map((group) =>
          group.fields.map((field) => {
            if (field.name === 'roleId') field.options = options;
          })
        );
        this.applyDefaultRole();
        this.updateDepartmentFieldForSelectedRoles();
        if (this.section !== 'settings') {
          this.loadAssignmentOptions();
        }
      },
      (error) => this.errorService.handleError(error, { prefix: this.translate.instant('roles.unableLoadRoles') })
    );
  }

  userHasRole(roleId: number): boolean {
    return this.user && this.user.roles && this.user.roles.map((role) => role.id).includes(roleId);
  }

  handleDeleteAction(user: User) {
    this.modalService.confirm({
      nzTitle: this.translate.instant('core.confirm'),
      nzContent: this.translate.instant('userManagement.deleteUserConfirm', { name: this.formatFullName(this.user) }),
      nzOkText: this.translate.instant('core.delete'),
      nzOnOk: () => this.deleteUser(user),
      nzCancelText: this.translate.instant('core.cancel'),
    });
  }

  deleteUser(user: User) {
    this.isLoading = true;
    const deleteObject: DeleteOneInput = { id: user.id };
    this.usersService
      .deleteOneUser(deleteObject)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => this.router.navigate(['/psira/user-management/users']),
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('userManagement.unableDeleteUser', { name: this.formatFullName(user) }),
          })
      );
  }

  handleCancel() {
    this.updatePasswordForm.groups.map((group) => group.fields.map((field) => (field.value = '')));
    this.showModal = false;
  }

  closeSupervisorCreatePanel(): void {
    this.router.navigate(['/psira/user-management/supervisors']);
  }

  userHasDepartment(departmentId: number): boolean {
    return this.user && this.user.departments && this.user.departments.map((dept) => dept.id).includes(departmentId);
  }

  collectRoles(roles: number[]) {
    const rolesIds: number[] = [];
    this.roles.map((role) => rolesIds.push(role.id));
    this.selectedRoles = roles;
    this.unselectedRoles = rolesIds.filter((id) => !this.selectedRoles.includes(id));
    for (const role of roles) {
      if (this.userHasRole(role)) this.selectedRoles.splice(this.selectedRoles.indexOf(role), role);
    }
  }

  collectDepartments(departments: number[]) {
    const departmentsIds: number[] = this.departments.map((department) => department.id);
    this.selectedDepartments = departments;
    this.unselectedDepartments = departmentsIds.filter((id) => !this.selectedDepartments.includes(id));
    this.submitDepartments();
  }

  async getUserFromUrl(): Promise<void> {
    this.routeSub = this.activatedRoute.queryParams.subscribe((params) => {
      this.populateForm = false;
      this.resetForm = false;
      if (params.user) {
        this.defaultRoleCode = params.roleCode;
        this.newMode = false;
        this.inputMode = false;
        this.showCancelButton = true;
        const bytes = decryptRoutePayload(params.user, environment.secretKey);
        const decryptedData = JSON.parse(bytes);
        this.user = this.withProfileRelations(decryptedData);
        if (this.user.birthDate) this.user.birthDate = decryptedData.birthDate.slice(0, 10);
        this.profileFields = userForms.userProfileEdit;
        this.populateForm = true;
        if (this.section !== 'settings') {
          this.loadAssignmentOptions();
        }
      } else if (this.activatedRoute.snapshot.data?.ownProfile) {
        this.loadOwnUserProfile();
      } else {
        this.defaultRoleCode = params.roleCode || this.activatedRoute.snapshot.data?.roleCode;
        const draft = params.draft ? this.decryptDraft(params.draft) : {};
        this.user = { password: this.generateTemporaryPassword(), ...draft } as User & { password: string };
        if (draft.departmentIds) {
          (this.user as any).departmentId = draft.departmentIds;
        }
        this.resetForm = false;
        this.newMode = true;
        this.inputMode = true;
        this.profileFields = userForms.userProfile;
        this.applyDefaultRole();
        this.populateForm = true;
        this.showCancelButton = false;
        if (this.section !== 'settings') {
          this.loadAssignmentOptions();
        }
        this.refreshAutomationPreview();
      }
    });
  }

  private loadOwnUserProfile(): void {
    this.isLoading = true;
    this.authService
      .getUserProfile()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }) => {
          this.user = this.withProfileRelations(UserModel.fromJson(data.getUserProfile));
          this.currentUser = this.user;
          localStorage.setItem('user', JSON.stringify(data.getUserProfile));
          this.defaultRoleCode = this.user.roles?.[0]?.code;
          if (this.user.birthDate) this.user.birthDate = String(this.user.birthDate).slice(0, 10) as any;
          this.newMode = false;
          this.inputMode = false;
          this.showCancelButton = true;
          this.profileFields = userForms.userProfileEdit;
          this.populateForm = true;
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load profile' })
      );
  }

  public handleProfileInputChange(change: { name: string; value: any }): void {
    if (!this.newMode || !['roleId', 'departmentId'].includes(change.name)) {
      return;
    }
    if (change.name === 'roleId') {
      this.previewRoleIds = Array.isArray(change.value) ? change.value : [change.value].filter((id) => !!id);
      this.updateDepartmentFieldForSelectedRoles();
    }
    if (change.name === 'departmentId') {
      this.previewDepartmentIds = Array.isArray(change.value) ? change.value : [change.value].filter((id) => !!id);
    }
    this.refreshAutomationPreview();
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

  createUser(formData: any) {
    formData.username = formData.email.toLowerCase();
    formData.roleCodes = this.getRoleCodes(formData.roleId ?? []);
    if (!this.defaultRoleCode && this.redirectSpecialRoleCreation(formData)) {
      return;
    }
    this.isLoading = true;
    this.populateForm = false;
    this.resetForm = false;
    formData.departmentIds = this.withDefaultDepartmentsForRoles(formData.departmentId ?? [], formData.roleCodes);
    formData.skippedAutomationIds = this.skippedAutomationIds;
    delete formData.roleId;
    delete formData.departmentId;
    const inputData: CreateUserInput = Object.assign({}, formData);
    const userInput: CreateOneUserInput = {
      user: inputData,
    };
    this.loadingMessage = this.translate.instant('userManagement.creatingUser', { name: this.formatFullName(inputData as any) });
    this.usersService
      .createUser(userInput)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loadingMessage = '';
        })
      )
      .subscribe(
        ({ data }) => {
          this._child.toggleEdit();
          this.message.create('success', this.translate.instant('userManagement.userCreated'));

          this.user = UserModel.fromJson(data.createOneUser);
          this.user = this.withProfileRelations(this.user);
          this.assignInitialRelationship();
          this.afterCreate();
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('userManagement.unableCreateUser'),
          })
      );
  }

  updateUser(userUpdates: CreateUserInput) {
    userUpdates.username = userUpdates.email?.toLowerCase();
    const roleIds = (userUpdates as any).roleId;
    const departmentIds = (userUpdates as any).departmentId;
    if (roleIds !== undefined) {
      userUpdates.roleCodes = this.getRoleCodes(roleIds ?? []);
    }
    if (departmentIds !== undefined) {
      userUpdates.departmentIds = this.withDefaultDepartmentsForRoles(departmentIds ?? [], userUpdates.roleCodes);
    }
    delete (userUpdates as any).roleId;
    delete (userUpdates as any).departmentId;

    const userInput: UpdateOneUserInput = {
      id: this.user.id,
      update: userUpdates,
    };
    this.isLoading = true;
    this.populateForm = false;
    this.resetForm = false;
    this.loadingMessage = this.translate.instant('userManagement.updatingUser', { name: this.formatFullName(userUpdates as any) });
    this.usersService
      .updateUser(userInput)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loadingMessage = '';
        })
      )
      .subscribe(
        async ({ data }) => {
          this.user = UserModel.fromJson(data.updateOneUser);
          this.user = this.withProfileRelations(this.user);
          this._child.toggleEdit();
          this.message.create('success', this.translate.instant('userManagement.userUpdated'));
        },
        (error) => {
          this.populateForm = true;
          this.errorService.handleError(error, {
            prefix: this.translate.instant('userManagement.unableUpdateUser', { name: this.formatFullName(userUpdates as any) }),
          });
        }
      );
  }

  submitRoles() {
    if (this.selectedRoles.length > 0) {
      this.assignRoles();
    }

    if (this.unselectedRoles.length > 0) {
      this.unassignRoles();
    }
  }

  submitDepartments() {
    if (this.selectedDepartments.length > 0) {
      this.assignDepartments();
    }

    if (this.selectedDepartments.length > 0) {
      this.unassignDepartment();
    }
  }

  afterCreate() {
    this.populateForm = false;
    this.resetForm = false;
    const dataString = encryptRoutePayload(JSON.stringify(this.user), environment.secretKey);
    this.router.navigate([this.defaultRoleCode ? '/psira/user-management/profile' : '/psira/user-management/user-form'], {
      state: { title: this.formatFullName(this.user) },
      queryParams: {
        user: dataString,
        roleCode: this.defaultRoleCode,
      },
    });
    this.newMode = false;
  }

  assignSupervisor(): void {
    if (!this.user?.id || !this.selectedSupervisorId) return;

    this.assignmentLoading = true;
    this.usersService
      .assignTherapistSupervisor({ therapistId: this.user.id, supervisorId: this.selectedSupervisorId })
      .pipe(finalize(() => (this.assignmentLoading = false)))
      .subscribe(
        () => {
          this.selectedSupervisorId = null;
          this.loadAssignedSupervisors();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('userManagement.unableAssignSupervisor') })
      );
  }

  assignTherapist(): void {
    if (!this.user?.id || !this.selectedTherapistId) return;

    this.assignmentLoading = true;
    this.usersService
      .assignTherapistSupervisor({ therapistId: this.selectedTherapistId, supervisorId: this.user.id })
      .pipe(finalize(() => (this.assignmentLoading = false)))
      .subscribe(
        () => {
          this.selectedTherapistId = null;
          this.loadAssignedTherapists();
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('userManagement.unableAssignTherapist') })
      );
  }

  assignRoles(role?: Role) {
    this.isLoading = true;
    const rolesIds: number[] = role ? [role.id] : this.selectedRoles;
    const currentRoleIds = this.user.roles?.map((userRole) => userRole.id) ?? [];
    const nextRoleIds = [...new Set([...currentRoleIds, ...rolesIds])];
    const roleCodes = this.getRoleCodes(nextRoleIds);
    const update: any = { roleCodes };
    update.departmentIds = this.withDefaultDepartmentsForRoles(
      this.user.departments?.map((department) => Number(department.id)) ?? [],
      roleCodes
    );
    this.usersService
      .updateUser({
        id: this.user.id,
        update,
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }) => {
          this.user = UserModel.fromJson(data.updateOneUser);
          this.user = this.withProfileRelations(this.user);
          this.message.create('success', this.translate.instant('userManagement.rolesAssigned'));
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('userManagement.unableAssignRoles'),
          })
      );
  }

  unassignRoles(role?: Role) {
    this.isLoading = true;
    const rolesIds: number[] = role ? [role.id] : this.unselectedRoles;
    const currentRoleIds = this.user.roles?.map((userRole) => userRole.id) ?? [];
    const nextRoleIds = currentRoleIds.filter((roleId) => !rolesIds.includes(roleId));
    this.usersService
      .updateUser({
        id: this.user.id,
        update: { roleCodes: this.getRoleCodes(nextRoleIds) },
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        ({ data }) => {
          this.user = UserModel.fromJson(data.updateOneUser);
          this.user = this.withProfileRelations(this.user);
          this.message.create('success', this.translate.instant('userManagement.rolesRemoved'));
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('userManagement.unableRemoveRoles'),
          })
      );
  }

  assignRoleToUser(role: Role, checked: boolean) {
    if (checked) {
      this.assignRoles(role);
    } else {
      this.unassignRoles(role);
    }
  }

  assignDepartments(department?: Department) {
    this.isLoading = true;
    const departmentsIds: number[] = department ? [department.id] : this.selectedDepartments;
    this.departmentsService
      .addDepartmentsToUser(this.user.id, departmentsIds)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => {
          this.message.create('success', this.translate.instant('userManagement.departmentsAssigned'));
          this.user.departments.push(department);
        },
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('userManagement.unableAssignDepartments'),
          })
      );
  }

  unassignDepartment(department?: Department) {
    this.isLoading = true;
    const departmentsIds: number[] = department ? [department.id] : this.unselectedDepartments;
    this.departmentsService
      .removeDepartmentsFromUser(this.user.id, departmentsIds)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => this.message.success(this.translate.instant('userManagement.departmentsRemoved')),
        (error) =>
          this.errorService.handleError(error, {
            prefix: this.translate.instant('userManagement.unableRemoveDepartments'),
          })
      );
  }

  assignDepartmentToUser(department: Department, checked: boolean) {
    if (checked) {
      this.assignDepartments(department);
    } else {
      this.unassignDepartment(department);
    }
  }

  submitForm(form: any): void {
    if (form.newPassword !== undefined) {
      this.updateUserPassword(form);
    } else {
      if (this.user.id != null) {
        this.updateUser(form);
      } else {
        this.createUser(form);
      }
    }
  }

  updateUserPassword(form: any) {
    if (this.user.id) {
      this.isLoading = true;
      this.loadingMessage = this.translate.instant('userManagement.updatingUser', { name: this.formatFullName(this.user) });
      const inputs: UserUpdatePasswordInput = {
        id: this.user.id,
        newPassword: form.newPassword,
        newPasswordConfirmation: form.newPasswordConfirmation,
      };
      this.usersService
        .updateUserPassword(inputs)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.loadingMessage = '';
          })
        )
        .subscribe(
          (_) => {
            this.showModal = false;
            this.message.create('success', this.translate.instant('systemMessages.passwordChanged'));
            this.updatePasswordForm.groups.map((group) => {
              group.fields.map((field) => {
                field.value = '';
              });
            });
          },
          (error) =>
            this.errorService.handleError(error, {
              prefix: this.translate.instant('systemMessages.unableChangePassword'),
            })
        );
    }
  }

  activateUser(user: User) {
    this.updateUser({ active: !user.active });
  }

  isCurrentUser(): boolean {
    return this.user?.id && this.currentUser?.id && this.user.id === this.currentUser.id;
  }

  private generateTemporaryPassword(): string {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  private formatFullName(user: Partial<User> | Partial<CreateUserInput>): string {
    return [user?.firstName, (user as any)?.middleName, user?.lastName].filter((part) => !!part).join(' ');
  }

  private getRoleCodes(roleIds: number[]): string[] {
    return this.roles
      .filter((role) => roleIds.includes(role.id))
      .map((role) => role.code);
  }

  private redirectSpecialRoleCreation(formData: any): boolean {
    const routeByRole: Record<string, string> = {
      PATIENT: '/psira/case-management/profile',
      THERAPIST: '/psira/user-management/therapist-form',
      CAREGIVER: '/psira/case-management/caregiver-form',
      SUPERVISOR: '/psira/user-management/supervisor-form',
    };
    const roleCode = ['PATIENT', 'THERAPIST', 'CAREGIVER', 'SUPERVISOR']
      .find((code) => (formData.roleCodes || []).includes(code));
    const route = roleCode ? routeByRole[roleCode] : undefined;
    if (!route) return false;

    const draft = {
      ...formData,
      departmentIds: formData.departmentId ?? [],
      roleCodes: formData.roleCodes,
    };
    delete draft.roleId;
    delete draft.departmentId;
    const dataString = encryptRoutePayload(JSON.stringify(draft), environment.secretKey);
    this.router.navigate([route], {
      queryParams: {
        draft: dataString,
        roleCode,
      },
    });
    return true;
  }

  private decryptDraft(value: string): any {
    try {
      const bytes = decryptRoutePayload(value, environment.secretKey);
      return JSON.parse(bytes);
    } catch (_) {
      return {};
    }
  }

  private withDefaultDepartmentsForRoles(departmentIds: number[], roleCodes?: string[]): number[] {
    const defaults = this.departments
      .filter((department) => this.departmentDefaultsForAnyRole(department, roleCodes || []))
      .map((department) => Number(department.id))
      .filter((id) => !!id);
    return [...new Set([...(departmentIds ?? []).map(Number), ...defaults])];
  }

  private withProfileRelations(user: User): User {
    (user as any).roleId = user.roles?.map((role) => role.id) ?? [];
    (user as any).departmentId = user.departments?.map((department) => department.id) ?? [];
    return user;
  }

  private refreshAutomationPreview(): void {
    if (!this.newMode) {
      this.automationPreview = [];
      return;
    }

    setTimeout(() => {
      const roleIds = this.previewRoleIds.length
        ? this.previewRoleIds
        : this.currentProfileFieldValue('roleId') || (this.user as any)?.roleId || [];
      const departmentIds = this.previewDepartmentIds.length
        ? this.previewDepartmentIds
        : this.currentProfileFieldValue('departmentId') || (this.user as any)?.departmentId || [];
      const normalizedRoleIds = Array.isArray(roleIds) ? roleIds : [roleIds].filter((id) => !!id);
      const normalizedDepartmentIds = Array.isArray(departmentIds)
        ? departmentIds
        : [departmentIds].filter((id) => !!id);

      if (!normalizedRoleIds.length || !normalizedDepartmentIds.length) {
        this.automationPreview = [];
        this.skippedAutomationIds = [];
        return;
      }

      this.automationPreviewLoading = true;
      this.evaluationAutomationsService
        .previewAutomations({
          roleIds: normalizedRoleIds.map(Number),
          departmentIds: normalizedDepartmentIds.map(Number),
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
    });
  }

  private currentProfileFieldValue(fieldName: string): any {
    for (const group of this.profileFields.groups || []) {
      const field = group.fields.find((item: any) => item.name === fieldName);
      if (field) return field.value;
    }
    return undefined;
  }

  private applyDefaultRole(): void {
    if (!this.newMode || !this.defaultRoleCode || !this.roles.length || !this.user) return;

    const defaultRole = this.roles.find((role) => role.code === this.defaultRoleCode);
    if (!defaultRole) return;

    (this.user as any).roleId = [defaultRole.id];
    this.previewRoleIds = [defaultRole.id];
    this.updateDepartmentFieldForSelectedRoles();
    this.refreshAutomationPreview();
    this.populateForm = false;
    setTimeout(() => (this.populateForm = true));
  }

  private updateDepartmentFieldForSelectedRoles(): void {
    const roleIds = this.previewRoleIds.length
      ? this.previewRoleIds
      : this.currentProfileFieldValue('roleId') || (this.user as any)?.roleId || [];
    const normalizedRoleIds = Array.isArray(roleIds) ? roleIds : [roleIds].filter((id) => !!id);
    const roleCodes = this.getRoleCodes(normalizedRoleIds.map(Number));
    const departmentField = this.findProfileField('departmentId');
    if (!departmentField) return;

    const filteredDepartments = roleCodes.length
      ? this.departments.filter((department) => this.departmentAppliesToAnyRole(department, roleCodes))
      : this.departments;

    departmentField.options = filteredDepartments.map((department: Department) => ({
      value: department.id,
      label: department.name,
    }));
    departmentField.isRequired = !roleCodes.includes('SUPER_ADMIN');

    const currentValue = this.currentProfileFieldValue('departmentId') || (this.user as any)?.departmentId || [];
    const currentDepartmentIds = Array.isArray(currentValue) ? currentValue.map(Number) : [Number(currentValue)].filter(Boolean);
    const availableIds = filteredDepartments.map((department) => Number(department.id));
    const retainedIds = currentDepartmentIds.filter((departmentId) => availableIds.includes(departmentId));
    const defaultIds = filteredDepartments
      .filter((department) => this.departmentDefaultsForAnyRole(department, roleCodes))
      .map((department) => Number(department.id));

    departmentField.value = [...new Set([...retainedIds, ...defaultIds])];
    if (this.user) {
      (this.user as any).departmentId = departmentField.value;
    }
    this.previewDepartmentIds = departmentField.value as number[];
  }

  private findProfileField(fieldName: string): any {
    for (const group of this.profileFields.groups || []) {
      const field = group.fields.find((item: any) => item.name === fieldName);
      if (field) return field;
    }
    return undefined;
  }

  private departmentAppliesToAnyRole(department: Department, roleCodes: string[]): boolean {
    const appliedRoleCodes = department.appliedRoleCodes || [];
    if (!appliedRoleCodes.length) return true;
    return roleCodes.some((roleCode) => appliedRoleCodes.includes(roleCode));
  }

  private departmentDefaultsForAnyRole(department: Department, roleCodes: string[]): boolean {
    const defaultRoleCodes = department.defaultRoleCodes || [];
    return roleCodes.some((roleCode) => defaultRoleCodes.includes(roleCode));
  }

  private assignInitialRelationship(): void {
    if (this.defaultRoleCode === 'THERAPIST' && this.selectedSupervisorId) {
      this.usersService
        .assignTherapistSupervisor({ therapistId: this.user.id, supervisorId: this.selectedSupervisorId })
        .subscribe(
          () => undefined,
          (error) => this.errorService.handleError(error, { prefix: this.translate.instant('userManagement.unableAssignSupervisor') })
        );
    }

    if (this.defaultRoleCode === 'SUPERVISOR' && this.selectedTherapistId) {
      this.usersService
        .assignTherapistSupervisor({ therapistId: this.selectedTherapistId, supervisorId: this.user.id })
        .subscribe(
          () => undefined,
          (error) => this.errorService.handleError(error, { prefix: this.translate.instant('userManagement.unableAssignTherapist') })
        );
    }
  }

  private loadAssignmentOptions(): void {
    if (this.defaultRoleCode === 'THERAPIST') {
      this.usersService.getSupervisors({ first: 50 }).subscribe(
        ({ data }: any) => {
          this.availableSupervisors = data.supervisors.edges.map((edge: any) => edge.node);
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('userManagement.unableLoadSupervisors') })
      );
      this.loadAssignedSupervisors();
    }

    if (this.defaultRoleCode === 'SUPERVISOR') {
      this.usersService.getTherapists({ first: 50 }).subscribe(
        ({ data }: any) => {
          this.availableTherapists = data.therapists.edges.map((edge: any) => edge.node);
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('userManagement.unableLoadTherapists') })
      );
      this.loadAssignedTherapists();
    }
  }

  private loadAssignedSupervisors(): void {
    if (!this.user?.id || this.defaultRoleCode !== 'THERAPIST') return;

    this.assignmentLoading = true;
    this.usersService
      .getSupervisors({ first: 50, therapistId: this.user.id })
      .pipe(finalize(() => (this.assignmentLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.assignedSupervisors = data.supervisors.edges.map((edge: any) => edge.node);
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('userManagement.unableLoadAssignedSupervisors') })
      );
  }

  private loadAssignedTherapists(): void {
    if (!this.user?.id || this.defaultRoleCode !== 'SUPERVISOR') return;

    this.assignmentLoading = true;
    this.usersService
      .getTherapists({ first: 50, supervisorId: this.user.id })
      .pipe(finalize(() => (this.assignmentLoading = false)))
      .subscribe(
        ({ data }: any) => {
          this.assignedTherapists = data.therapists.edges.map((edge: any) => edge.node);
        },
        (error) => this.errorService.handleError(error, { prefix: this.translate.instant('userManagement.unableLoadAssignedTherapists') })
      );
  }
}
