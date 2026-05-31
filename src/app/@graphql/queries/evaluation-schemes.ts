import gql from 'graphql-tag';

const evaluationSchemeFields = `
  id
  name
  description
  schemeType
  defaultRecurrenceRule
  defaultDurationMinutes
  durationDays
  active
  emailNotificationsEnabled
  mailTemplateId
  createdAt
  updatedAt
  departments {
    id
    name
  }
  sessionTemplates {
    id
    sessionKind
    sessionIndex
    title
    relativeOffsetDays
    durationMinutes
    resourceTemplates {
      id
      resourceKind
      assessmentTypeId
      questionnaireIds
      questionnaireBundleIds
      sessionSelector
      everyNSessions
      startSessionNumber
      endSessionNumber
      informantType
      defaultResponderRole
      activationAnchor
      activationOffsetMinutes
      availabilityDurationMinutes
      reminderMinutes
    }
  }
  independentEvaluationTemplates {
    id
    assessmentTypeId
    questionnaireIds
    questionnaireBundleIds
    relativeDay
    relativeMinuteOfDay
    startMinuteOfDay
    durationMinutes
    endMinuteOfDay
    triggerMode
    availabilityDurationMinutes
    reminderMinutes
    required
    singleResponse
    seedOrder
    informantType
    defaultResponderRole
  }
`;

const evaluationSchemes = gql`
  query($paging: CursorPaging, $filter: EvaluationSchemeFilter, $sorting: [EvaluationSchemeSort!]) {
    evaluationSchemes(paging: $paging, filter: $filter, sorting: $sorting) {
      edges {
        cursor
        node {
          ${evaluationSchemeFields}
        }
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const EvaluationSchemesQueries = {
  evaluationSchemes,
};
