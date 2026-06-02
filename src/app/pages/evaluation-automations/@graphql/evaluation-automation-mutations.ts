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
  createdAt
  updatedAt
`;

const createEvaluationAutomation = gql`
  mutation($automation: CreateEvaluationAutomationInput!) {
    createEvaluationAutomation(automation: $automation) {
      ${evaluationAutomationFields}
    }
  }
`;

const updateEvaluationAutomation = gql`
  mutation($automation: UpdateEvaluationAutomationInput!) {
    updateEvaluationAutomation(automation: $automation) {
      ${evaluationAutomationFields}
    }
  }
`;

const duplicateEvaluationAutomation = gql`
  mutation($id: Int!) {
    duplicateEvaluationAutomation(id: $id) {
      ${evaluationAutomationFields}
    }
  }
`;

const setEvaluationAutomationActive = gql`
  mutation($id: Int!, $active: Boolean!) {
    setEvaluationAutomationActive(id: $id, active: $active) {
      ${evaluationAutomationFields}
    }
  }
`;

const deleteEvaluationAutomation = gql`
  mutation($id: Int!) {
    deleteEvaluationAutomation(id: $id)
  }
`;

export const EvaluationAutomationMutations = {
  createEvaluationAutomation,
  updateEvaluationAutomation,
  duplicateEvaluationAutomation,
  setEvaluationAutomationActive,
  deleteEvaluationAutomation,
};
