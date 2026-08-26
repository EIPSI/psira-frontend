import gql from 'graphql-tag';

const evaluationAutomationFields = `
  id
  title
  description
  active
  triggerPoint
  automationType
  triggerSessionNumber
  triggerReasonIds
  triggerReasonContexts
  lastLoginInactiveDays
  lastLoginConditionLogic
  lastLoginConditions {
    field
    operator
    value
  }
  delayAmount
  delayUnit
  priority
  conditions {
    field
    operator
    value
  }
  evaluationName
  schemeId
  schemeRandomizationRuleId
  assessmentTypeId
  questionnaireIds
  questionnaireBundleIds
  randomizationRuleIds
  expirationMinutes
  expirationUnit
  reminderMinutes
  reminderUnit
  createdAt
  updatedAt
  departments {
    id
    name
  }
  role {
    id
    name
    code
  }
  scheme {
    id
    name
  }
  assessmentType {
    id
    name
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

const evaluationAutomations = gql`
  query($paging: CursorPaging, $filter: EvaluationAutomationFilter, $sorting: [EvaluationAutomationSort!]) {
    evaluationAutomations(paging: $paging, filter: $filter, sorting: $sorting) {
      edges {
        cursor
        node {
          ${evaluationAutomationFields}
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

const evaluationAutomation = gql`
  query($id: Int!) {
    evaluationAutomation(id: $id) {
      ${evaluationAutomationFields}
    }
  }
`;

const evaluationAutomationLookupDepartments = gql`
  query($paging: CursorPaging, $filter: DepartmentFilter, $sorting: [DepartmentSort!]) {
    departments(paging: $paging, filter: $filter, sorting: $sorting) {
      edges {
        cursor
        node {
          id
          name
          active
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

const evaluationAutomationLookupRoles = gql`
  query($paging: CursorPaging, $filter: RoleFilter, $sorting: [RoleSort!]) {
    roles(paging: $paging, filter: $filter, sorting: $sorting) {
      edges {
        cursor
        node {
          id
          name
          code
          hierarchy
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

const evaluationAutomationPreview = gql`
  query($input: EvaluationAutomationPreviewInput!) {
    evaluationAutomationPreview(input: $input) {
      automationId
      title
      triggerPoint
      automationType
      resourceType
      resourceName
      scheduledAt
      delayLabel
    }
  }
`;

const evaluationAutomationRuns = gql`
  query($paging: CursorPaging, $filter: EvaluationAutomationRunFilter, $sorting: [EvaluationAutomationRunSort!]) {
    evaluationAutomationRuns(paging: $paging, filter: $filter, sorting: $sorting) {
      edges {
        cursor
        node {
          id
          automationId
          automationTitle
          userId
          triggerPoint
          triggerEventId
          status
          reason
          message
          resourceType
          resourceId
          createdAt
          updatedAt
          automation {
            id
            title
          }
          user {
            id
            firstName
            middleName
            lastName
            username
            email
          }
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

export const EvaluationAutomationQueries = {
  evaluationAutomations,
  evaluationAutomation,
  evaluationAutomationLookupDepartments,
  evaluationAutomationLookupRoles,
  evaluationAutomationPreview,
  caseEventReasons,
  evaluationAutomationRuns,
};
