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

const randomizationRules = gql`
  query($paging: CursorPaging, $filter: RandomizationRuleFilter, $sorting: [RandomizationRuleSort!], $departmentIds: [Int!]) {
    randomizationRules(paging: $paging, filter: $filter, sorting: $sorting, departmentIds: $departmentIds) {
      edges {
        cursor
        node {
          ${randomizationRuleFields}
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

const getRandomizationRule = gql`
  query($id: Int!) {
    getRandomizationRule(id: $id) {
      ${randomizationRuleFields}
    }
  }
`;

export const RandomizationQueries = {
  randomizationRules,
  getRandomizationRule,
};
