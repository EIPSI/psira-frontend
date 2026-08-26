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
      name
      questionnaireIds
      questionnaireBundleIds
      randomizationRuleIds
      sessionSelector
      everyNSessions
      startSessionNumber
      endSessionNumber
      informantType
      defaultResponderRole
      activationAnchor
      activationOffsetMinutes
      availabilityDurationMinutes
      availabilityDurationUnit
      reminderMinutes
      reminderUnit
    }
  }
  independentEvaluationTemplates {
    id
    assessmentTypeId
    name
    questionnaireIds
    questionnaireBundleIds
    randomizationRuleIds
    relativeDay
    relativeMinuteOfDay
    startMinuteOfDay
    durationMinutes
    endMinuteOfDay
    triggerMode
    availabilityDurationMinutes
    availabilityDurationUnit
    reminderMinutes
    reminderUnit
    required
    singleResponse
    seedOrder
    informantType
    defaultResponderRole
  }
`;

const evaluationSchemes = gql`
  query($paging: CursorPaging, $filter: EvaluationSchemeFilter, $sorting: [EvaluationSchemeSort!], $departmentIds: [Int!]) {
    evaluationSchemes(paging: $paging, filter: $filter, sorting: $sorting, departmentIds: $departmentIds) {
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
