import gql from 'graphql-tag';

const getQuestionnaireBundles = gql`
  query($paging: CursorPaging, $filter: QuestionnaireBundleFilter, $sorting: [QuestionnaireBundleSort!], $departmentIds: [Float!]) {
    getQuestionnaireBundles(paging: $paging, filter: $filter, sorting: $sorting, departmentIds: $departmentIds) {
      edges {
        node {
          _id
          name
          active
          departmentIds
          structureJson
          headerHtml
          noticeHtml
          createdAt
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

const getQuestionnaireBundle = gql`
  query($_id: String!) {
    getQuestionnaireBundle(_id: $_id) {
      _id
      name
      active
      departmentIds
      structureJson
      headerHtml
      noticeHtml
      createdAt
      updatedAt
    }
  }
`;
export const BundleQueries = {
  getQuestionnaireBundles,
  getQuestionnaireBundle,
};
