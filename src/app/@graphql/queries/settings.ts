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
      googleCalendarEnabled
      googleCalendarClientId
      googleCalendarRedirectUri
    }
  }
`;

export const SettingsQueries = {
  settings,
};
