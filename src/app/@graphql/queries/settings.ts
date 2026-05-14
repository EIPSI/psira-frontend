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
      sendWelcomeEmails
      welcomeEmailTemplateId
    }
  }
`;

export const SettingsQueries = {
  settings,
};
