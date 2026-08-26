export interface Setting {
  systemLocale: string;
  systemTimezone: string;
  dateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;
  maxLoginAttempts: number;
  passwordLifeTimeInDays: number;
  passwordReUseCutoffInDays: number;
  evaluationAutomationRunRetentionDays: number;
  patientCaseManagerAssignableHierarchyRank: number;
  googleCalendarEnabled?: boolean;
  googleCalendarClientId?: string;
  googleCalendarClientSecret?: string;
  googleCalendarRedirectUri?: string;
}
