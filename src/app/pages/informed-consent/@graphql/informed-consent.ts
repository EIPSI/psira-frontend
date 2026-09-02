import gql from 'graphql-tag';

const modelFields = `
  id
  name
  kind
  description
  active
  systemDefault
  currentPublishedVersionId
  departments { id name }
  currentPublishedVersion {
    id
    versionNumber
    title
    status
    submitButtonLabel
    thankYouHtml
    publishedAt
    textBlocks { id orderIndex title content }
    questions {
      id
      kind
      kinds
      questionType
      orderIndex
      label
      helpText
      required
      answerOptions { id orderIndex value label resolution blocksUsageOnSelection }
    }
  }
  versions {
    id
    versionNumber
    title
    status
    submitButtonLabel
    thankYouHtml
    publishedAt
    textBlocks { id orderIndex title content }
    questions {
      id
      kind
      kinds
      questionType
      orderIndex
      label
      helpText
      required
      answerOptions { id orderIndex value label resolution blocksUsageOnSelection }
    }
  }
`;

const managementFields = `
  id
  title
  description
  modelId
  status
  trigger
  mandatory
  appliesToAllDepartments
  appliesToAllRoles
  priority
  active
  model { id name kind currentPublishedVersionId }
  departments { id name }
  roles { id name code }
`;

const responseFields = `
  id
  managementId
  modelId
  versionId
  signerUserId
  representedUserId
  patientId
  status
  finalResolution
  mandatorySnapshot
  answeredAt
  blockedAt
  createdAt
  model { id name kind }
  management { id title trigger mandatory }
  version {
    id
    versionNumber
    title
    status
    submitButtonLabel
    thankYouHtml
    publishedAt
    textBlocks { id orderIndex title content }
    questions {
      id
      kind
      kinds
      questionType
      orderIndex
      label
      helpText
      required
      answerOptions { id orderIndex value label resolution blocksUsageOnSelection }
    }
  }
  answers {
    id
    questionId
    answerOptionId
    valueText
    resolution
    answerOption { id label resolution }
  }
  signer { id firstName lastName email username }
  representedUser { id firstName lastName email username }
  patient { id firstName lastName medicalRecordNo }
`;

export const InformedConsentGraphql = {
  models: gql`query { informedConsentModels { ${modelFields} } }`,
  model: gql`query($id: Int!) { informedConsentModel(id: $id) { ${modelFields} } }`,
  pendingModel: gql`query($id: Int!) { pendingInformedConsentModel(id: $id) { ${modelFields} } }`,
  publicPendingModel: gql`query($token: String!, $id: Int!) { publicPendingInformedConsentModel(token: $token, id: $id) { ${modelFields} } }`,
  shortcuts: gql`query { informedConsentShortcuts { group label token description } }`,
  createModel: gql`mutation($input: CreateInformedConsentModelInput!) { createInformedConsentModel(input: $input) { ${modelFields} } }`,
  updateModel: gql`mutation($input: UpdateInformedConsentModelInput!) { updateInformedConsentModel(input: $input) { ${modelFields} } }`,
  deleteModel: gql`mutation($id: Int!) { deleteInformedConsentModel(id: $id) }`,
  duplicateModel: gql`mutation($id: Int!) { duplicateInformedConsentModel(id: $id) { ${modelFields} } }`,
  publishVersion: gql`mutation($versionId: Int!) { publishInformedConsentVersion(versionId: $versionId) { ${modelFields} } }`,
  managements: gql`query { informedConsentManagements { ${managementFields} } }`,
  management: gql`query($id: Int!) { informedConsentManagement(id: $id) { ${managementFields} } }`,
  createManagement: gql`mutation($input: CreateInformedConsentManagementInput!) { createInformedConsentManagement(input: $input) { ${managementFields} } }`,
  updateManagement: gql`mutation($input: UpdateInformedConsentManagementInput!) { updateInformedConsentManagement(input: $input) { ${managementFields} } }`,
  duplicateManagement: gql`mutation($id: Int!) { duplicateInformedConsentManagement(id: $id) { ${managementFields} } }`,
  deleteManagement: gql`mutation($id: Int!) { deleteInformedConsentManagement(id: $id) }`,
  responses: gql`query { informedConsentResponses { ${responseFields} } }`,
  myResponses: gql`query { myInformedConsentResponses { ${responseFields} } }`,
  response: gql`query($id: Int!) { informedConsentResponse(id: $id) { ${responseFields} } }`,
  pending: gql`query { pendingInformedConsents { managementId modelId versionId title kind trigger mandatory blocking responseId responseStatus } }`,
  publicPending: gql`query($token: String!) { publicPendingInformedConsents(token: $token) { managementId modelId versionId title kind trigger mandatory blocking responseId responseStatus } }`,
  submitResponse: gql`
    mutation($input: SubmitInformedConsentResponseInput!) {
      submitInformedConsentResponse(input: $input) { ${responseFields} }
    }
  `,
  submitPublicResponse: gql`
    mutation($token: String!, $input: SubmitInformedConsentResponseInput!) {
      submitPublicInformedConsentResponse(token: $token, input: $input) { ${responseFields} }
    }
  `,
  reactivateResponse: gql`
    mutation($input: ReviewInformedConsentResponseInput!) {
      reactivateInformedConsentResponse(input: $input) { ${responseFields} }
    }
  `,
  reactivateMyResponse: gql`
    mutation($input: ReviewInformedConsentResponseInput!) {
      reactivateMyInformedConsentResponse(input: $input) { ${responseFields} }
    }
  `,
  cancelMyReactivation: gql`
    mutation($input: CancelInformedConsentReactivationInput!) {
      cancelMyInformedConsentReactivation(input: $input) { ${responseFields} }
    }
  `,
  cancelPublicReactivation: gql`
    mutation($token: String!, $input: CancelInformedConsentReactivationInput!) {
      cancelPublicInformedConsentReactivation(token: $token, input: $input) { ${responseFields} }
    }
  `,
  revokeResponse: gql`
    mutation($input: ReviewInformedConsentResponseInput!) {
      revokeInformedConsentResponse(input: $input) { ${responseFields} }
    }
  `,
};
