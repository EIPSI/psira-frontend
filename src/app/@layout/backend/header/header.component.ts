import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '@app/auth/auth.service';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { User } from '@app/pages/user-management/@types/user';
import { Form } from '@shared/components/form/@types/form';
import { userForms } from '@app/pages/user-management/@forms/user.form';
import { UserChangePasswordInput } from '@app/pages/user-management/user-form/user-update-password.type';
import { UsersService } from '@app/pages/user-management/@services/users.service';
import { FormComponent } from '@shared/components/form/form.component';
import { FieldGroup } from '@shared/components/form/@types/field.group';
import { TranslationItem } from '@shared/@types/translation';
import { ErrorHandlerService } from '../../../@shared/services/error-handler.service';
import { InformedConsentService } from '@app/pages/informed-consent/@services/informed-consent.service';

import { NzMessageService } from 'ng-zorro-antd/message';
import { I18nService } from '@app/i18n/i18n.service';
import { TranslateService } from '@ngx-translate/core';
import { encryptRouteObject, encryptRoutePayload, decryptRoutePayload } from '@app/@shared/utils/route-crypto.util';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @ViewChild(FormComponent) child: FormComponent;
  isOkLoading = false;
  user: User;
  translations: TranslationItem[] = [{ code: 'en', name: 'English' }];
  changePasswordModal = false;
  loadingMessage = '';
  changePasswordForm: Form = userForms.changeUserPassword;
  isLoading = false;
  hasBlockingInformedConsent = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private usersService: UsersService,
    private message: NzMessageService,
    private errorService: ErrorHandlerService,
    private informedConsentService: InformedConsentService,
    private i18nService: I18nService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.getUser();
    this.loadInformedConsentBlock();
    this.loadActiveLanguages();
  }

  getUser() {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.authService.getUserProfile().subscribe(
      ({ data }) => {
        this.user = data.getUserProfile;
        localStorage.setItem('user', JSON.stringify(data.getUserProfile));
      },
      (err) => this.errorService.handleError(err, { prefix: this.translate.instant('systemMessages.unableGetUserProfile') })
    );
  }

  clickChangePassword() {
    this.child.handleSubmitForm(this.changePasswordForm);
  }
  onChangeTranslation(item: TranslationItem) {
    this.i18nService.setLanguage(item.code);
  }

  isCurrentLanguage(item: TranslationItem): boolean {
    return item?.code === this.i18nService.language;
  }

  private loadActiveLanguages(): void {
    this.i18nService.loadActiveLanguages().subscribe((languages) => {
      if (!languages.length) return;
      this.translations = languages.map((language) => ({
        code: language.code,
        name: language.nativeName || language.name,
      }));
      this.i18nService.setSupportedLanguages(this.translations.map((language) => language.code));
    });
  }

  editUserProfile() {
    if (this.hasBlockingInformedConsent) {
      return;
    }
    const dataString = encryptRouteObject(this.user, environment.secretKey);
    const title = [this.user.firstName, this.user.lastName].filter(Boolean).join(' ');
    this.router.navigate(['/psira/user-management/my-profile'], {
      state: {
        title,
      },
      queryParams: {
        user: dataString,
      },
    });
  }

  changePassword(form: any) {
    if (this.user.id) {
      this.isLoading = true;
      this.loadingMessage = `Updating user ${this.user.firstName} ${this.user.lastName}`;
      const inputs: UserChangePasswordInput = {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        newPasswordConfirmation: form.newPasswordConfirmation,
      };
      this.usersService.changeUserPassword(inputs).subscribe(
        () => {
          this.isLoading = false;
          this.loadingMessage = '';
          this.message.success(this.translate.instant('systemMessages.passwordChanged'));
          this.handleCancel();
        },
        (error) => {
          this.isLoading = false;
          this.loadingMessage = '';
          this.errorService.handleError(error, { prefix: this.translate.instant('systemMessages.unableChangePassword') });
        }
      );
    }
  }

  logout() {
    this.authService.logout().subscribe(
      async ({ data }) => {
        this.isOkLoading = false;
        const items = ['auth_app_token', 'user', 'settings', 'tabs', 'activeTabIndex', 'permissions'];
        for (const item of items) {
          localStorage.removeItem(item);
        }
        this.router.navigate(['/auth/login']);
      },
      (error) => {
        this.isOkLoading = false;
      }
    );
  }

  handleCancel() {
    this.changePasswordModal = false;
    this.changePasswordForm.groups.forEach((group: FieldGroup) => {
      group.fields.find((field) => {
        field.value = null;
      });
    });
  }

  showChangePasswordModal() {
    this.changePasswordModal = true;
  }

  private loadInformedConsentBlock(): void {
    this.informedConsentService.getPending().subscribe(
      (pending) => {
        this.hasBlockingInformedConsent = (pending || []).some((consent) => consent.blocking);
      },
      () => {
        this.hasBlockingInformedConsent = false;
      }
    );
  }
}
