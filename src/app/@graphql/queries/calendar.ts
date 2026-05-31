import gql from 'graphql-tag';

const calendarOccurrenceFields = `
  id
  occurrenceType
  title
  startAt
  endAt
  timezone
  status
  schemeId
  schemeAssignmentId
  patientId
  therapistId
  supervisorId
  isDetachedFromTemplate
  notes
  patient {
    id
    medicalRecordNo
    firstName
    middleName
    lastName
  }
  therapist {
    id
    firstName
    middleName
    lastName
  }
  supervisor {
    id
    firstName
    middleName
    lastName
  }
  clinicalSession {
    id
    sessionNumber
    clinicalStatus
  }
  assessments {
    id
    status
    deliveryDate
    expirationDate
    assessmentType {
      id
      name
    }
  }
`;

const calendarOccurrences = gql`
  query(
    $from: DateTime!
    $to: DateTime!
    $patientId: Int
    $therapistId: Int
    $supervisorId: Int
    $occurrenceType: CalendarOccurrenceType
  ) {
    calendarOccurrences(
      from: $from
      to: $to
      patientId: $patientId
      therapistId: $therapistId
      supervisorId: $supervisorId
      occurrenceType: $occurrenceType
    ) {
      ${calendarOccurrenceFields}
    }
  }
`;

const calendarEvents = gql`
  query($filter: CalendarEventFilterInput!) {
    calendarEvents(filter: $filter) {
      id
      type
      title
      description
      startAt
      endAt
      status
      color
      editable
      deletable
      occurrenceId
      occurrenceType
      patientId
      therapistId
      supervisorId
      clinicalSessionId
      sessionKind
      sessionNumber
      assessmentId
      assessmentOrigin
    }
  }
`;

const googleCalendarAuthorizationUrl = gql`
  query {
    googleCalendarAuthorizationUrl
  }
`;

const googleCalendarIntegrationStatus = gql`
  query {
    googleCalendarIntegrationStatus {
      configured
    }
  }
`;

const clinicalSessions = gql`
  query($filter: ClinicalSessionListFilterInput) {
    clinicalSessions(filter: $filter) {
      id
      sessionKind
      sessionNumber
      clinicalStatus
      clinicalHistory
      historyLabel
      patientId
      therapistId
      supervisorId
      calendarOccurrence {
        id
        title
        startAt
        endAt
        status
      }
      patient {
        id
        medicalRecordNo
        firstName
        middleName
        lastName
      }
      therapist {
        id
        firstName
        middleName
        lastName
        workID
      }
      supervisor {
        id
        firstName
        middleName
        lastName
        workID
      }
      resources {
        id
        resourceKind
        status
        activationAt
        expirationAt
        assessment {
          id
          status
          deliveryDate
          expirationDate
          assessmentType {
            id
            name
          }
        }
      }
    }
  }
`;

export const CalendarQueries = {
  calendarOccurrences,
  calendarEvents,
  googleCalendarAuthorizationUrl,
  googleCalendarIntegrationStatus,
  clinicalSessions,
};
