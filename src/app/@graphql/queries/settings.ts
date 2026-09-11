import gql from 'graphql-tag';

const settings = gql`
  query {
    settings {
      systemLocale
      systemTimezone
      dateFormat
      timeFormat
      dateTimeFormat
      maxLoginAttempts
      passwordLifeTimeInDays
      passwordReUseCutoffInDays
      notificationLogRetentionDays
      accessTokenRetentionDays
      evaluationAutomationRunRetentionDays
      treatmentFinalizationUndoWindowDays
      patientCaseManagerAssignableHierarchyRank
      notificationsEnabled
      informedConsentEnabled
      googleCalendarEnabled
      googleCalendarClientId
      googleCalendarRedirectUri
    }
  }
`;

export const SettingsQueries = {
  settings,
};
