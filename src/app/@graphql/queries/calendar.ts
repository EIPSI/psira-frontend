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
  responsibleUsers {
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
    name
    questionnaireAssessmentId
    status
    deliveryDate
    expirationDate
    reminderMinutes
    reminderUnit
    schemeRelativeSessionNumber
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
      responsibleUserIds
      clinicalSessionId
      sessionKind
      sessionNumber
      modality
      cancellationType
      cancellationReasonSnapshot
      cancellationComment
      assessmentId
      clinicalSessionResourceId
      assessmentOrigin
    }
  }
`;

const clinicalSessionCancellationReasons = gql`
  query($parentId: Int, $includeInactive: Boolean) {
    clinicalSessionCancellationReasons(parentId: $parentId, includeInactive: $includeInactive) {
      id
      label
      nextLevelLabel
      parentId
      active
      sortOrder
    }
  }
`;

const caseEventReasons = gql`
  query($context: CaseEventReasonContext!, $parentId: Int, $departmentId: Int, $includeInactive: Boolean, $exactDepartment: Boolean) {
    caseEventReasons(context: $context, parentId: $parentId, departmentId: $departmentId, includeInactive: $includeInactive, exactDepartment: $exactDepartment) {
      id
      context
      label
      nextLevelLabel
      parentId
      departmentId
      active
      isOther
      sortOrder
    }
  }
`;

const caseEventReasonTrees = gql`
  query($includeInactive: Boolean) {
    caseEventReasonTrees(includeInactive: $includeInactive) {
      id
      context
      departmentId
      active
      levelLabels
    }
  }
`;

const clinicalSessionSchemeApplications = gql`
  query($clinicalSessionId: Int!) {
    clinicalSessionSchemeApplications(clinicalSessionId: $clinicalSessionId) {
      id
      schemeId
      sessionKind
      patientId
      therapistId
      startClinicalSessionId
      startSessionNumber
      applicationMode
      status
      stoppedAtClinicalSessionId
      scheme {
        id
        name
      }
    }
  }
`;

const clinicalSessionFollowUpVersions = gql`
  query($clinicalSessionId: Int!) {
    clinicalSessionFollowUpVersions(clinicalSessionId: $clinicalSessionId) {
      id
      clinicalSessionId
      previousText
      nextText
      editedByUserId
      createdAt
      editedBy {
        id
        firstName
        middleName
        lastName
      }
    }
  }
`;

const clinicalSessionFollowUpSettings = gql`
  query {
    clinicalSessionFollowUpSettings {
      id
      editWindowDays
      updatedAt
    }
  }
`;

const questionnaireAssessment = gql`
  query($id: String!) {
    getAssessment(_id: $id) {
      _id
      status
      answers {
        _id
        question
        occurrenceId
        valid
        textValue
        multipleChoiceValue
        numberValue
        dateValue
        booleanValue
      }
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
      modality
      clinicalStatus
      cancellationType
      cancellationReasonSnapshot
      cancellationComment
      cancelledSessionNumber
      cancelledStartAt
      clinicalHistory
      historyLabel
      patientId
      therapistId
      supervisorId
      responsibleUsers {
        id
        firstName
        middleName
        lastName
        workID
      }
      calendarOccurrence {
        id
        title
        startAt
        endAt
        status
        responsibleUsers {
          id
          firstName
          middleName
          lastName
        }
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
        activationAnchor
        activationOffsetMinutes
        availabilityDurationMinutes
        reminderMinutes
        activationAt
        expirationAt
        replacementResourceId
        replacedResourceId
        schemeRelativeSessionNumber
        assessment {
          id
          questionnaireAssessmentId
          status
          deliveryDate
          expirationDate
          schemeRelativeSessionNumber
          assessmentType {
            id
            name
          }
        }
      }
    }
  }
`;

const caseHistoryEntries = gql`
  query($filter: CaseHistoryFilterInput!) {
    caseHistoryEntries(filter: $filter) {
      id
      entryKind
      cycleKind
      patientId
      therapistId
      treatmentCycleId
      clinicalSessionId
      sessionNumber
      occurredAt
      title
      content
      reasonSnapshot
      createdAt
      updatedAt
    }
  }
`;

const activeTreatmentCycle = gql`
  query($filter: TreatmentCycleListFilterInput!) {
    activeTreatmentCycle(filter: $filter) {
      id
      cycleKind
      status
      cycleNumber
      patientId
      therapistId
      startedAt
      finalizedAt
      finalizationReasonSnapshot
      finalizationNote
      newTreatmentReasonSnapshot
      newTreatmentNote
      daysSincePreviousFinalization
      previousCycleCount
      lastSessionNumber
      finalizationUndoExpiresAt
    }
  }
`;

const treatmentCycles = gql`
  query($filter: TreatmentCycleListFilterInput) {
    treatmentCycles(filter: $filter) {
      id
      cycleKind
      status
      cycleNumber
      patientId
      therapistId
      startedAt
      finalizedAt
      finalizationReasonSnapshot
      finalizationNote
      newTreatmentReasonSnapshot
      newTreatmentNote
      daysSincePreviousFinalization
      previousCycleCount
      lastSessionNumber
      finalizationUndoExpiresAt
    }
  }
`;

export const CalendarQueries = {
  calendarOccurrences,
  calendarEvents,
  clinicalSessionSchemeApplications,
  clinicalSessionFollowUpVersions,
  clinicalSessionFollowUpSettings,
  questionnaireAssessment,
  clinicalSessionCancellationReasons,
  caseEventReasons,
  caseEventReasonTrees,
  googleCalendarAuthorizationUrl,
  googleCalendarIntegrationStatus,
  clinicalSessions,
  caseHistoryEntries,
  activeTreatmentCycle,
  treatmentCycles,
};
