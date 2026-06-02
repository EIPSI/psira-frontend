import gql from 'graphql-tag';

const evaluationAutomationFields = `
  id
  title
  description
  active
  triggerPoint
  automationType
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
  assessmentTypeId
  questionnaireIds
  questionnaireBundleIds
  randomizationRuleIds
  expirationMinutes
  reminderMinutes
  emailNotificationsEnabled
  mailTemplateId
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

export const EvaluationAutomationQueries = {
  evaluationAutomations,
  evaluationAutomation,
  evaluationAutomationLookupDepartments,
  evaluationAutomationLookupRoles,
  evaluationAutomationPreview,
};
