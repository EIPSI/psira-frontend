import gql from 'graphql-tag';

const createQuestionnaire = gql`
  mutation($xlsForm: CreateQuestionnaireInput!, $excelFile: Upload!) {
    createQuestionnaire(xlsForm: $xlsForm, excelFile: $excelFile) {
      _id
      name
      status
      createdAt
      keywords
      copyright
      description
      website
      license
      timeToComplete
      language
      abbreviation
      departmentIds
      versionRootId
      versionNumber
      replacedById
    }
  }
`;

const updateQuestionnaire = gql`
  mutation($_id: String!, $xlsForm: UpdateQuestionnaireInput!, $excelFile: Upload) {
    updateQuestionnaire(_id: $_id, xlsForm: $xlsForm, excelFile: $excelFile) {
      _id
      name
      status
      createdAt
      keywords
      copyright
      description
      website
      license
      timeToComplete
      language
      abbreviation
      departmentIds
      versionRootId
      versionNumber
      replacedById
    }
  }
`;

const deleteQuestionnaire = gql`
  mutation($_id: String!) {
    deleteQuestionnaire(_id: $_id) {
      _id
    }
  }
`;

export const QuestionnaireMutations = {
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
};
