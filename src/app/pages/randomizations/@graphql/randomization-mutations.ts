import gql from 'graphql-tag';

const randomizationRuleFields = `
  id
  name
  type
  active
  itemCount
  createdAt
  updatedAt
  departments {
    id
    name
  }
  items {
    id
    itemType
    questionnaireId
    questionnaireBundleId
    evaluationSchemeId
    weight
    position
  }
`;

const createRandomizationRule = gql`
  mutation($rule: CreateRandomizationRuleInput!) {
    createRandomizationRule(rule: $rule) {
      ${randomizationRuleFields}
    }
  }
`;

const updateRandomizationRule = gql`
  mutation($rule: UpdateRandomizationRuleInput!) {
    updateRandomizationRule(rule: $rule) {
      ${randomizationRuleFields}
    }
  }
`;

const duplicateRandomizationRule = gql`
  mutation($id: Int!) {
    duplicateRandomizationRule(id: $id) {
      ${randomizationRuleFields}
    }
  }
`;

const setRandomizationRuleActive = gql`
  mutation($id: Int!, $active: Boolean!) {
    setRandomizationRuleActive(id: $id, active: $active) {
      ${randomizationRuleFields}
    }
  }
`;

const deleteRandomizationRule = gql`
  mutation($id: Int!) {
    deleteRandomizationRule(id: $id)
  }
`;

export const RandomizationMutations = {
  createRandomizationRule,
  updateRandomizationRule,
  duplicateRandomizationRule,
  setRandomizationRuleActive,
  deleteRandomizationRule,
};
