import { Component, OnInit } from '@angular/core';
import { DEFAULT_PAGE_SIZE } from '@app/@shared/@modules/master-data/@types/list';
import { Form } from '../../../../@shared/components/form/@types/form';
import { EmailTemplatesService } from '../../@services/email-templates.service';
import { Setting } from '../../@types/setting';
import { settingsForms } from '../@forms/form';
import { SettingsService } from '../../@services/settings.service';

@Component({
  selector: 'app-automatic-email-settings',
  templateUrl: './automatic-email-settings.component.html',
  styleUrls: ['./automatic-email-settings.component.scss'],
})
export class AutomaticEmailSettingsComponent implements OnInit {
  settingsForm: Form = settingsForms.automaticEmails;
  isLoading = false;
  settings: Setting;

  constructor(
    private settingsService: SettingsService,
    private emailTemplatesService: EmailTemplatesService
  ) {}

  ngOnInit(): void {
    this.getWelcomeTemplates();
    this.getSettings();
  }

  getSettings(): void {
    this.isLoading = true;
    this.settingsService.settings().subscribe(
      ({ data }) => {
        this.settings = Object.assign({}, data.settings);
        this.populateForm();
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  saveSettings(values: Partial<Setting>): void {
    this.isLoading = true;
    this.settingsService.updateSetting({
      ...this.settings,
      ...values,
    } as Setting).subscribe(
      () => {
        this.settings = { ...this.settings, ...values } as Setting;
        localStorage.setItem('settings', JSON.stringify(this.settings));
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  private getWelcomeTemplates(): void {
    this.emailTemplatesService
      .getAllEmailTemplates({
        paging: { first: DEFAULT_PAGE_SIZE },
        filter: { module: { eq: 'WELCOME' } } as any,
      })
      .subscribe(({ data }: any) => {
        const options = data.getAllEmailTemplates.edges.map((edge: any) => ({
          value: Number(edge.node.id),
          label: edge.node.name,
        }));

        this.settingsForm.groups.forEach((group) => {
          group.fields.forEach((field) => {
            if (field.name === 'welcomeEmailTemplateId') {
              field.options = options;
            }
          });
        });
      });
  }

  private populateForm(): void {
    this.settingsForm.groups.forEach((group) => {
      group.fields.forEach((field) => {
        field.value = this.settings[field.name];
      });
    });
  }
}
