export interface Setting {
  systemLocale: string;
  systemTimezone: string;
  dateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;
  maxLoginAttempts: number;
  passwordLifeTimeInDays: number;
  passwordReUseCutoffInDays: number;
  sendWelcomeEmails: boolean;
  welcomeEmailTemplateId: number;
  googleCalendarEnabled?: boolean;
  googleCalendarClientId?: string;
  googleCalendarClientSecret?: string;
  googleCalendarRedirectUri?: string;
}
