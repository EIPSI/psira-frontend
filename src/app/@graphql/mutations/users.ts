import gql from 'graphql-tag';

const createOneUser = gql`
  mutation($createOneUserInput: CreateOneUserInput!) {
    createOneUser(input: $createOneUserInput) {
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
      permissions {
        id
        name
        createdAt
        updatedAt
      }
    }
  }
`;

const updateOneUser = gql`
  mutation($updateOneUserInput: UpdateOneUserInput!) {
    updateOneUser(input: $updateOneUserInput) {
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
      acceptedTerm
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
      permissions {
        id
        name
        createdAt
        updatedAt
      }
    }
  }
`;
const changeUserPassword = gql`
  mutation($currentPassword: String!, $newPassword: String!, $newPasswordConfirmation: String!) {
    changePassword(
      currentPassword: $currentPassword
      newPassword: $newPassword
      newPasswordConfirmation: $newPasswordConfirmation
    )
  }
`;
const updateUserPassword = gql`
  mutation($newPassword: String!, $newPasswordConfirmation: String!, $id: Int!) {
    updateUserPassword(input: { newPassword: $newPassword, newPasswordConfirmation: $newPasswordConfirmation }, id: $id)
  }
`;
const deleteOneUser = gql`
  mutation($input: DeleteOneUserInput!) {
    deleteOneUser(input: $input)
  }
`;

const softDeleteUser = gql`
  mutation($id: ID!) {
    updateOneUser(input: { id: $id, update: { deleted: true } }) {
      id
      workID
      firstName
      middleName
      lastName
      phone
      email
      address
      gender
      birthDate
      createdAt
      updatedAt
      deletedAt
    }
  }
`;

const userAcceptedTerm = gql`
  mutation($updateOneUserInput: UpdateOneUserInput!) {
    updateUserAcceptedTerm(input: $updateOneUserInput) {
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
      acceptedTerm
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
      permissions {
        id
        name
        createdAt
        updatedAt
      }
    }
  }
`;

const assignTherapistSupervisor = gql`
  mutation($therapistId: Int!, $supervisorId: Int!) {
    assignTherapistSupervisor(therapistId: $therapistId, supervisorId: $supervisorId)
  }
`;

const unassignTherapistSupervisor = gql`
  mutation($therapistId: Int!, $supervisorId: Int!) {
    unassignTherapistSupervisor(therapistId: $therapistId, supervisorId: $supervisorId)
  }
`;

const assignSupervisorPatientVisibility = gql`
  mutation($therapistId: Int!, $supervisorId: Int!, $patientId: Int!) {
    assignSupervisorPatientVisibility(therapistId: $therapistId, supervisorId: $supervisorId, patientId: $patientId)
  }
`;

const unassignSupervisorPatientVisibility = gql`
  mutation($therapistId: Int!, $supervisorId: Int!, $patientId: Int!) {
    unassignSupervisorPatientVisibility(therapistId: $therapistId, supervisorId: $supervisorId, patientId: $patientId)
  }
`;

export const UsersMutations = {
  createOneUser,
  updateOneUser,
  deleteOneUser,
  softDeleteUser,
  updateUserPassword,
  changeUserPassword,
  userAcceptedTerm,
  assignTherapistSupervisor,
  unassignTherapistSupervisor,
  assignSupervisorPatientVisibility,
  unassignSupervisorPatientVisibility,
};
