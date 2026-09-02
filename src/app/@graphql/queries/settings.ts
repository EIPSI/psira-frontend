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
