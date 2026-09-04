import gql from 'graphql-tag';

const createLanguage = gql`
  mutation($input: CreateLanguageInput!) {
    createLanguage(input: $input) {
      id
      code
      name
      nativeName
      active
      isDefault
      fallbackCode
    }
  }
`;

const updateLanguage = gql`
  mutation($input: UpdateLanguageInput!) {
    updateLanguage(input: $input) {
      id
      code
      name
      nativeName
      active
      isDefault
      fallbackCode
    }
  }
`;

const updateTranslationValue = gql`
  mutation($input: UpdateTranslationValueInput!) {
    updateTranslationValue(input: $input) {
      id
      languageCode
      key
      value
    }
  }
`;

export const LanguageMutations = {
  createLanguage,
  updateLanguage,
  updateTranslationValue,
};
