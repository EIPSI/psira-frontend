import gql from 'graphql-tag';

const assessments = gql`
  query($paging: CursorPaging, $filter: AssessmentFilter, $sorting: [AssessmentSort!]) {
    assessments(paging: $paging, filter: $filter, sorting: $sorting) {
      edges {
        cursor
        node {
          id
          uuid
          name
          date
          assessmentType {
            id
            name
          }
          emailReminder
          emailStatus
          receiverEmail
          patientId
          targetUserId
          responderUserId
          mailTemplateId
          reminderMinutes
          reminderUnit
          clinicianId
          submissionDate
          status
          deliveryDate
          expirationDate
          note
          origin
          editableFromAssessmentList
          clinicalSessionId
          schemeId
          schemeAssignmentId
          createdAt
          updatedAt
          deletedAt
          informantType
          clinician {
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
          }
          targetUser {
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
            roles {
              id
              name
              hierarchy
              code
            }
          }
          responderUser {
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
          }
          informantClinician {
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
          }
          informantCaregiverRelation
          clinicalSession {
            id
            sessionKind
            sessionNumber
            clinicalStatus
            historyLabel
            calendarOccurrence {
              id
              title
              startAt
              endAt
            }
          }
          patient {
            id
            active
            medicalRecordNo
            firstName
            middleName
            lastName
            phone
            email
            address
            gender
            birthDate
            birthCountryCode
            nationality
            createdAt
            updatedAt
          }
          questionnaireAssessment {
            status
            randomizationRuleIds
            questionnaireBundles{
              _id
              name
            }
            resolvedQuestionnaires {
              occurrenceId
              questionnaireId
              sourceBundleId
              path
              orderIndex
            }
            questionnaires(populate: true) {
              _id
              name
              status
              createdAt
              keywords
              copyright
              website
              license
              timeToComplete
              language
              abbreviation
              questionGroups {
                label
                questions {
                  _id
                  name
                  label
                  type
                  hint
                  relevant
                  calculation
                  constraint
                  constraintMessage
                  min
                  max
                  required
                  requiredMessage
                  image
                  appearance
                  default
                  choices {
                    name
                    label
                    image
                  }
                }
              }
            }
          }
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

const patientAssessments = gql`
  query($patientId: Int!, $includeArchived: Boolean) {
    patientAssessments(patientId: $patientId, includeArchived: $includeArchived) {
      id
      uuid
      name
      date
      assessmentType {
        id
        name
      }
      emailReminder
      emailStatus
      receiverEmail
      patientId
      targetUserId
      responderUserId
      mailTemplateId
      reminderMinutes
      reminderUnit
      clinicianId
      submissionDate
      status
      deliveryDate
      expirationDate
      note
      origin
      editableFromAssessmentList
      clinicalSessionId
      schemeId
      schemeAssignmentId
      createdAt
      updatedAt
      deletedAt
      deleted
      informantType
      clinician {
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
      }
      responsibleUsers {
        id
        username
        active
        firstName
        middleName
        lastName
        email
        workID
      }
      targetUser {
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
        roles {
          id
          name
          hierarchy
          code
        }
      }
      responderUser {
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
      }
      informantClinician {
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
      }
      informantCaregiverRelation
      clinicalSession {
        id
        sessionKind
        sessionNumber
        clinicalStatus
        historyLabel
        calendarOccurrence {
          id
          title
          startAt
          endAt
        }
      }
      patient {
        id
        active
        medicalRecordNo
        firstName
        middleName
        lastName
        phone
        email
        address
        gender
        birthDate
        birthCountryCode
        nationality
        createdAt
        updatedAt
      }
      questionnaireAssessment {
        status
        randomizationRuleIds
        questionnaireBundles {
          _id
          name
        }
        resolvedQuestionnaires {
          occurrenceId
          questionnaireId
          sourceBundleId
          path
          orderIndex
        }
        questionnaires(populate: true) {
          _id
          name
          status
          createdAt
          keywords
          copyright
          website
          license
          timeToComplete
          language
          abbreviation
        }
      }
    }
  }
`;

const questionnaires = gql`
  query($paging: CursorPaging, $filter: AssessmentFilter, $sorting: [AssessmentSort!]) {
    questionnaires(paging: $paging, filter: $filter, sorting: $sorting) {
      edges {
        cursor
        node {
          id
          name
          version
          abbreviation
          language
          timeToComplete
          description
          copyright
          license
          website
          references
          icd10
          createdAt
          updatedAt
          deletedAt
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
const c = `questionnaires {
            id
            name
            version
            abbreviation
            language
            timeToComplete
            description
            copyright
            license
            website
            references
            icd10
            createdAt
            updatedAt
          }`;

const getFullAssessment = gql`
  query($id: Int!) {
    getFullAssessment(id: $id) {
      id
      uuid
      name
      isActive
      date
      assessmentType {
        id
        name
      }
      emailReminder
      emailStatus
      receiverEmail
      mailTemplateId
      reminderMinutes
      reminderUnit
      status
      deliveryDate
      expirationDate
      note
      createdAt
      updatedAt
      deletedAt
      informantType
      informantCaregiverRelation
      patientId
      targetUserId
      responderUserId
      clinicianId
      questionnaireAssessmentId
      informantClinician {
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
      }
      targetUser {
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
        roles {
          id
          name
          hierarchy
          code
        }
      }
      responderUser {
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
      }
      questionnaireAssessment {
        questionnaireBundles{
          _id
          name
        }
        _id
        status
        randomizationRuleIds
        answers {
          question
          occurrenceId
          valid
          textValue
          multipleChoiceValue
          numberValue
          dateValue
          booleanValue
        }
        resolvedQuestionnaires {
          occurrenceId
          questionnaireId
          sourceBundleId
          path
          orderIndex
        }
        questionnaires(populate: true) {
          _id
          name
          status
          createdAt
          keywords
          copyright
          website
          license
          timeToComplete
          language
          abbreviation
          questionGroups {
            label
            questions {
              _id
              name
              label
              type
              hint
              relevant
              calculation
              constraint
              constraintMessage
              min
              max
              required
              requiredMessage
              image
              appearance
              default
              choices {
                name
                label
                image
              }
            }
          }
        }
      }
      clinician {
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
      }
      responsibleUsers {
        id
        username
        active
        firstName
        middleName
        lastName
        email
        workID
      }
      patient {
        id
        active
        medicalRecordNo
        firstName
        middleName
        lastName
        phone
        email
        address
        gender
        birthDate
        birthCountryCode
        nationality
        createdAt
        updatedAt
        caseManagers {
          id
          username
          active
          firstName
          middleName
          lastName
          email
          workID
        }
      }
    }
  }
`;

const getFullPublicAssessment = gql`
  query($uuid: String!) {
    getFullPublicAssessment(uuid: $uuid) {
      id
      uuid
      date
      assessmentType {
        id
        name
      }
      status
      createdAt
      updatedAt
      deletedAt
      deliveryDate
      expirationDate
      informantType
      questionnaireAssessment {
        _id
        status
        answers {
          question
          occurrenceId
          valid
          textValue
          multipleChoiceValue
          numberValue
          dateValue
          booleanValue
        }
        resolvedQuestionnaires {
          occurrenceId
          questionnaireId
          sourceBundleId
          path
          orderIndex
        }
        questionnaires(populate: true) {
          _id
          name
          status
          createdAt
          keywords
          copyright
          website
          license
          timeToComplete
          language
          abbreviation
          questionGroups {
            label
            appearance
            questions {
              _id
              name
              label
              type
              hint
              relevant
              calculation
              constraint
              constraintMessage
              min
              max
              required
              requiredMessage
              image
              default
              choices {
                name
                label
                image
              }
            }
          }
        }
      }
    }
  }
`;

export const AssessmentsQueries = {
  assessments,
  patientAssessments,
  questionnaires,
  getFullAssessment,
  getFullPublicAssessment,
};
