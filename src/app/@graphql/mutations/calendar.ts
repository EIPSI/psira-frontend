import gql from 'graphql-tag';

const moveCalendarOccurrence = gql`
  mutation($id: Int!, $startAt: DateTime!, $endAt: DateTime!) {
    moveCalendarOccurrence(id: $id, startAt: $startAt, endAt: $endAt) {
      id
      startAt
      endAt
      isDetachedFromTemplate
    }
  }
`;

const createClinicalSession = gql`
  mutation($session: CreateClinicalSessionInput!) {
    createClinicalSession(session: $session) {
      id
      sessionKind
      sessionNumber
      clinicalStatus
      calendarOccurrence {
        id
        title
        startAt
        endAt
        occurrenceType
        status
      }
    }
  }
`;

const createAssessmentOccurrence = gql`
  mutation($assessment: CreateFullAssessmentInput!) {
    createAssessmentOccurrence(assessment: $assessment) {
      id
      title
      startAt
      endAt
      occurrenceType
      status
      assessments {
        id
        status
        deliveryDate
        expirationDate
      }
    }
  }
`;

const moveClinicalSession = gql`
  mutation($session: MoveClinicalSessionInput!) {
    moveClinicalSession(session: $session) {
      id
      clinicalStatus
      calendarOccurrence {
        id
        startAt
        endAt
        isDetachedFromTemplate
      }
      resources {
        id
        resourceKind
        status
        activationAt
        expirationAt
        replacementResourceId
      }
    }
  }
`;

const cancelClinicalSession = gql`
  mutation($session: CancelClinicalSessionInput!) {
    cancelClinicalSession(session: $session) {
      id
      sessionNumber
      clinicalStatus
      calendarOccurrence {
        id
        status
        cancellationReason
      }
    }
  }
`;

const updateClinicalSession = gql`
  mutation($session: UpdateClinicalSessionInput!) {
    updateClinicalSession(session: $session) {
      id
      clinicalStatus
      clinicalHistory
      calendarOccurrence {
        id
        startAt
        endAt
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
        }
      }
    }
  }
`;

const connectGoogleCalendar = gql`
  mutation($code: String!) {
    connectGoogleCalendar(code: $code) {
      id
      userId
      calendarId
      syncEnabled
      tokenExpiresAt
    }
  }
`;

const pullGoogleCalendarDateChange = gql`
  mutation($externalEventId: String!) {
    pullGoogleCalendarDateChange(externalEventId: $externalEventId) {
      id
      startAt
      endAt
      isDetachedFromTemplate
    }
  }
`;

export const CalendarMutations = {
  moveCalendarOccurrence,
  createClinicalSession,
  createAssessmentOccurrence,
  moveClinicalSession,
  updateClinicalSession,
  cancelClinicalSession,
  connectGoogleCalendar,
  pullGoogleCalendarDateChange,
};
