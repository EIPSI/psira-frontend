import gql from 'graphql-tag';

const getUsers = gql`
  query($paging: CursorPaging, $filter: UserFilter, $sorting: [UserSort!]) {
    users(paging: $paging, filter: $filter, sorting: $sorting) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          username
          active
          firstName
          middleName
          lastName
          email
          phone
          workID
          address
          gender
          birthDate
          nationality
          createdAt
          updatedAt
          deletedAt
          departments {
            id
            name
            description
            active
          }
          roles {
            id
            name
            isSuperAdmin
            hierarchy
            code
            createdAt
            updatedAt
          }
          permissionGrants {
            id
            name
          }
          permissions {
            id
            name
            createdAt
            updatedAt
          }
        }
        cursor
      }
    }
  }
`;

const getUserProfile = gql`
  query {
    getUserProfile {
      id
      workID
      firstName
      lastName
      phone
      email
      address
      isSuperUser
      passwordChangeRequired
      gender
      birthDate
      acceptedTerm
      updatedAt
      createdAt
      roles {
        id
        name
        isSuperAdmin
        hierarchy
        code
        createdAt
        updatedAt
      }
      permissions {
        id
        name
        createdAt
        updatedAt
      }
      departments {
        id
        name
        description
        active
        createdAt
        updatedAt
      }
    }
  }
`;

const supervisionUserFields = `
  edges {
    cursor
    node {
      id
      username
      active
      firstName
      middleName
      lastName
      email
      phone
      workID
      departments {
        id
        name
        description
        active
      }
      roles {
        id
        name
        isSuperAdmin
        hierarchy
        code
      }
      permissions {
        id
        name
      }
    }
  }
  pageInfo {
    startCursor
    endCursor
    hasNextPage
    hasPreviousPage
  }
`;

const therapists = gql`
  query($first: Int, $after: String, $last: Int, $before: String, $searchKeyword: String, $supervisorId: Int) {
    therapists(
      first: $first
      after: $after
      last: $last
      before: $before
      searchKeyword: $searchKeyword
      supervisorId: $supervisorId
    ) {
      ${supervisionUserFields}
    }
  }
`;

const supervisors = gql`
  query($first: Int, $after: String, $last: Int, $before: String, $searchKeyword: String, $therapistId: Int) {
    supervisors(
      first: $first
      after: $after
      last: $last
      before: $before
      searchKeyword: $searchKeyword
      therapistId: $therapistId
    ) {
      ${supervisionUserFields}
    }
  }
`;

const supervisorVisiblePatients = gql`
  query($therapistId: Int!, $supervisorId: Int!) {
    supervisorVisiblePatients(therapistId: $therapistId, supervisorId: $supervisorId) {
      id
      firstName
      middleName
      lastName
      medicalRecordNo
      email
      phone
    }
  }
`;

export const UsersQueries = {
  getUsers,
  getUserProfile,
  therapists,
  supervisors,
  supervisorVisiblePatients,
};
