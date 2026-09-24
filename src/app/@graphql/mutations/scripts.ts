import gql from 'graphql-tag';

const createOneScript = gql`
  mutation($input: CreateQuestionnaireScriptInput!, $scriptText: Upload!) {
    createNewQuestionnaireScript(input: $input, scriptText: $scriptText) {
      id
      name
      scriptText
      version
      creator
      repositoryLink
      createdAt
      updatedAt
      deletedAt
      reports {
        id
      }
    }
  }
`;

const updateOneScript = gql`
  mutation($input: UpdateQuestionnaireScriptInput!, $scriptText: Upload) {
    updateOneQuestionnaireScript(input: $input, scriptText: $scriptText) {
      id
      name
      scriptText
      version
      creator
      repositoryLink
      createdAt
      updatedAt
      deletedAt
      reports {
        id
      }
    }
  }
`;

const deleteOneScript = gql`
  mutation($input: DeleteQuestionnaireScriptInput!) {
    deleteOneQuestionnaireScript(input: $input) {
      id
    }
  }
`;

export const ScriptsMutations = {
  createOneScript,
  updateOneScript,
  deleteOneScript,
};
