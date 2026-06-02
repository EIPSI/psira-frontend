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
      patientCaseManagerAssignableHierarchyRank
      sendWelcomeEmails
      welcomeEmailTemplateId
      googleCalendarEnabled
      googleCalendarClientId
      googleCalendarRedirectUri
    }
  }
`;

export const SettingsQueries = {
  settings,
};
