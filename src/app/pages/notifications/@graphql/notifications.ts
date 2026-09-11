import gql from 'graphql-tag';

const configurationFields = `
  id
  departmentId
  channel
  family
  event
  recipientRoleId
  mailTemplateId
  active
  notes
  department {
    id
    name
  }
  recipientRole {
    id
    name
    code
  }
  mailTemplate {
    id
    name
    subject
    senderName
  }
`;

const notificationConfigurations = gql`
  query {
    notificationConfigurations {
      ${configurationFields}
    }
  }
`;

const notificationConfiguration = gql`
  query($id: Int!) {
    notificationConfiguration(id: $id) {
      ${configurationFields}
    }
  }
`;

const notificationTemplateShortcuts = gql`
  query {
    notificationTemplateShortcuts {
      group
      label
      token
      description
    }
  }
`;

const preferenceFields = `
  id
  patientId
  therapistId
  userId
  enabled
  immediateEnabled
  periodicEnabled
  periodicEvery
  periodicUnit
  enabledEvents
  excludedRecipientIds
  lastPeriodicSentAt
`;

const notificationPreference = gql`
  query($input: NotificationPreferenceQueryInput!) {
    notificationPreference(input: $input) {
      ${preferenceFields}
    }
  }
`;

const createNotificationConfiguration = gql`
  mutation($input: CreateNotificationConfigurationInput!) {
    createNotificationConfiguration(input: $input) {
      ${configurationFields}
    }
  }
`;

const updateNotificationConfiguration = gql`
  mutation($input: UpdateNotificationConfigurationInput!) {
    updateNotificationConfiguration(input: $input) {
      ${configurationFields}
    }
  }
`;

const deleteNotificationConfiguration = gql`
  mutation($id: Int!) {
    deleteNotificationConfiguration(id: $id)
  }
`;

const updateNotificationPreference = gql`
  mutation($input: UpdateNotificationPreferenceInput!) {
    updateNotificationPreference(input: $input) {
      ${preferenceFields}
    }
  }
`;

export const NotificationsGraphql = {
  notificationConfigurations,
  notificationConfiguration,
  notificationTemplateShortcuts,
  notificationPreference,
  createNotificationConfiguration,
  updateNotificationConfiguration,
  deleteNotificationConfiguration,
  updateNotificationPreference,
};
