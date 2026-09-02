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
  treatmentFinalizationUndoWindowDays: number;
  patientCaseManagerAssignableHierarchyRank: number;
  notificationsEnabled?: boolean;
  informedConsentEnabled?: boolean;
  googleCalendarEnabled?: boolean;
  googleCalendarClientId?: string;
  googleCalendarClientSecret?: string;
  googleCalendarRedirectUri?: string;
}
