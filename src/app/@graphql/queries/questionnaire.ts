import gql from 'graphql-tag';

const getQuestionnaires = gql`
  query($paging: CursorPaging, $filter: QuestionnaireFilter, $sorting: [QuestionnaireSort!], $departmentIds: [Float!]) {
    questionnaires(paging: $paging, filter: $filter, sorting: $sorting, departmentIds: $departmentIds) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          _id
          name
          zombie
          status
          createdAt
          keywords
          description
          copyright
          website
          license
          timeToComplete
          language
          abbreviation
          departmentIds
          questionGroups {
            label
            questions {
              _id
              name
              label
              type
              choices {
                name
                label
              }
            }
          }
        }
      }
    }
  }
`;
const getQuestionnairesVersion = gql`
  query($paging: CursorPaging, $filter: QuestionnaireVersionFilter, $sorting: [QuestionnaireVersionSort!]) {
    getQuestionnaireVersions(paging: $paging, filter: $filter, sorting: $sorting) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          _id
          name
          status
          createdAt
          keywords
          description
          copyright
          website
          license
          timeToComplete
          language
          abbreviation
          departmentIds
          questionGroups {
            label
            questions {
              _id
              name
              label
              type
              choices {
                name
                label
              }
            }
          }
        }
      }
    }
  }
`;

export const QuestionnaireQueries = {
  getQuestionnaires,
  getQuestionnairesVersion,
};
