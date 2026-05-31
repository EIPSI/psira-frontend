import gql from 'graphql-tag';

const createQuestionnaireBundle = gql`
  mutation($input: CreateQuestionnaireBundleInput!) {
    createQuestionnaireBundle(input: $input) {
      _id
      name
      active
      departmentIds
      structureJson
      createdAt
      updatedAt
    }
  }
`;

const updateQuestionnaireBundle = gql`
  mutation($input: UpdateQuestionnaireBundleInput!) {
    updateQuestionnaireBundle(input: $input) {
      _id
      name
      active
      departmentIds
      structureJson
      createdAt
      updatedAt
    }
  }
`;

const deleteQuestionnaireBundle = gql`
  mutation($_id: String!) {
    deleteQuestionnaireBundle(_id: $_id) {
      _id
      name
      active
      departmentIds
      createdAt
      updatedAt
    }
  }
`;

export const BundleMutations = {
  createQuestionnaireBundle,
  updateQuestionnaireBundle,
  deleteQuestionnaireBundle,
};
