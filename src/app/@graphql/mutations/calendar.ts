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
      modality
      clinicalStatus
      therapistId
      supervisorId
      responsibleUsers {
        id
        firstName
        middleName
        lastName
      }
      calendarOccurrence {
        id
        title
        startAt
        endAt
        occurrenceType
        status
        responsibleUsers {
          id
          firstName
          middleName
          lastName
        }
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
        name
        status
        deliveryDate
        expirationDate
        reminderMinutes
        reminderUnit
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
      sessionNumber
      modality
      clinicalStatus
      clinicalHistory
      therapistId
      supervisorId
      responsibleUsers {
        id
        firstName
        middleName
        lastName
      }
      calendarOccurrence {
        id
        startAt
        endAt
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
        assessment {
          id
          questionnaireAssessmentId
          status
          deliveryDate
          expirationDate
          schemeRelativeSessionNumber
        }
      }
    }
  }
`;

const restructureClinicalSessions = gql`
  mutation($restructure: RestructureClinicalSessionsInput!) {
    restructureClinicalSessions(restructure: $restructure) {
      id
      sessionKind
      sessionNumber
      modality
      clinicalStatus
      calendarOccurrence {
        id
        title
        startAt
        endAt
        status
      }
    }
  }
`;

const updateClinicalSessionResource = gql`
  mutation($resource: UpdateClinicalSessionResourceInput!) {
    updateClinicalSessionResource(resource: $resource) {
      id
      resourceKind
      status
      activationAnchor
      activationOffsetMinutes
      availabilityDurationMinutes
      reminderMinutes
      activationAt
      expirationAt
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
`;

const addClinicalSessionSchemes = gql`
  mutation($schemes: AddClinicalSessionSchemesInput!) {
    addClinicalSessionSchemes(schemes: $schemes) {
      id
      resourceKind
      status
      activationAt
      expirationAt
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
`;

const discardClinicalSessionAssessment = gql`
  mutation($assessment: DiscardClinicalSessionAssessmentInput!) {
    discardClinicalSessionAssessment(assessment: $assessment) {
      id
      resourceKind
      status
      assessment {
        id
        status
      }
    }
  }
`;

const stopClinicalSessionScheme = gql`
  mutation($scheme: StopClinicalSessionSchemeInput!) {
    stopClinicalSessionScheme(scheme: $scheme) {
      id
      schemeId
      status
      stoppedAtClinicalSessionId
      scheme {
        id
        name
      }
    }
  }
`;

const updateClinicalSessionFollowUpSettings = gql`
  mutation($settings: UpdateClinicalSessionFollowUpSettingsInput!) {
    updateClinicalSessionFollowUpSettings(settings: $settings) {
      id
      editWindowDays
      updatedAt
    }
  }
`;

const caseEventReasonFields = `
  id
  context
  label
  nextLevelLabel
  parentId
  departmentId
  active
  isOther
  sortOrder
`;

const createCaseEventReason = gql`
  mutation($reason: CreateCaseEventReasonInput!) {
    createCaseEventReason(reason: $reason) {
      ${caseEventReasonFields}
    }
  }
`;

const updateCaseEventReason = gql`
  mutation($reason: UpdateCaseEventReasonInput!) {
    updateCaseEventReason(reason: $reason) {
      ${caseEventReasonFields}
    }
  }
`;

const deactivateCaseEventReason = gql`
  mutation($id: Int!) {
    deactivateCaseEventReason(id: $id) {
      ${caseEventReasonFields}
    }
  }
`;

const deleteCaseEventReason = gql`
  mutation($id: Int!) {
    deleteCaseEventReason(id: $id)
  }
`;

const caseEventReasonTreeFields = `
  id
  context
  departmentId
  active
  levelLabels
`;

const createCaseEventReasonTree = gql`
  mutation($tree: CreateCaseEventReasonTreeInput!) {
    createCaseEventReasonTree(tree: $tree) {
      ${caseEventReasonTreeFields}
    }
  }
`;

const updateCaseEventReasonTree = gql`
  mutation($tree: UpdateCaseEventReasonTreeInput!) {
    updateCaseEventReasonTree(tree: $tree) {
      ${caseEventReasonTreeFields}
    }
  }
`;

const deactivateCaseEventReasonTree = gql`
  mutation($id: Int!) {
    deactivateCaseEventReasonTree(id: $id) {
      ${caseEventReasonTreeFields}
    }
  }
`;

const createClinicalSessionCancellationReason = gql`
  mutation($reason: CreateClinicalSessionCancellationReasonInput!) {
    createClinicalSessionCancellationReason(reason: $reason) {
      id
      label
      parentId
      active
      sortOrder
    }
  }
`;

const updateClinicalSessionCancellationReason = gql`
  mutation($reason: UpdateClinicalSessionCancellationReasonInput!) {
    updateClinicalSessionCancellationReason(reason: $reason) {
      id
      label
      parentId
      active
      sortOrder
    }
  }
`;

const deactivateClinicalSessionCancellationReason = gql`
  mutation($id: Int!) {
    deactivateClinicalSessionCancellationReason(id: $id) {
      id
      active
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

const finalizeTreatmentCycle = gql`
  mutation($input: FinalizeTreatmentCycleInput!) {
    finalizeTreatmentCycle(input: $input) {
      id
      cycleKind
      status
      cycleNumber
      patientId
      therapistId
      finalizedAt
      finalizationReasonSnapshot
      finalizationNote
      lastSessionNumber
      finalizationUndoExpiresAt
    }
  }
`;

const cancelTreatmentCycleFinalization = gql`
  mutation($input: CancelTreatmentCycleFinalizationInput!) {
    cancelTreatmentCycleFinalization(input: $input) {
      id
      cycleKind
      status
      finalizationCancelledAt
      finalizationCancellationNote
    }
  }
`;

const startNewTreatmentCycle = gql`
  mutation($input: StartNewTreatmentCycleInput!) {
    startNewTreatmentCycle(input: $input) {
      id
      cycleKind
      status
      cycleNumber
      patientId
      therapistId
      startedAt
      newTreatmentReasonSnapshot
      newTreatmentNote
      daysSincePreviousFinalization
      previousCycleCount
    }
  }
`;

const createCaseHistoryNote = gql`
  mutation($input: CreateCaseHistoryNoteInput!) {
    createCaseHistoryNote(input: $input) {
      id
      entryKind
      cycleKind
      patientId
      therapistId
      treatmentCycleId
      occurredAt
      title
      content
    }
  }
`;

export const CalendarMutations = {
  moveCalendarOccurrence,
  createClinicalSession,
  createAssessmentOccurrence,
  moveClinicalSession,
  restructureClinicalSessions,
  updateClinicalSession,
  updateClinicalSessionResource,
  addClinicalSessionSchemes,
  discardClinicalSessionAssessment,
  stopClinicalSessionScheme,
  updateClinicalSessionFollowUpSettings,
  createCaseEventReason,
  updateCaseEventReason,
  deactivateCaseEventReason,
  deleteCaseEventReason,
  createCaseEventReasonTree,
  updateCaseEventReasonTree,
  deactivateCaseEventReasonTree,
  createClinicalSessionCancellationReason,
  updateClinicalSessionCancellationReason,
  deactivateClinicalSessionCancellationReason,
  cancelClinicalSession,
  connectGoogleCalendar,
  pullGoogleCalendarDateChange,
  finalizeTreatmentCycle,
  cancelTreatmentCycleFinalization,
  startNewTreatmentCycle,
  createCaseHistoryNote,
};
