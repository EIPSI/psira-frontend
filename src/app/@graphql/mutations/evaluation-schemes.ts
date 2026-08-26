import gql from 'graphql-tag';

const schemeFields = `
  id
  name
  description
  schemeType
  defaultRecurrenceRule
  defaultDurationMinutes
  durationDays
  active
  departments {
    id
    name
  }
  sessionTemplates {
    id
    sessionKind
    sessionIndex
    title
    relativeOffsetDays
    durationMinutes
    resourceTemplates {
      id
      resourceKind
      assessmentTypeId
      questionnaireIds
      questionnaireBundleIds
      randomizationRuleIds
      sessionSelector
      everyNSessions
      startSessionNumber
      endSessionNumber
      informantType
      defaultResponderRole
      activationAnchor
      activationOffsetMinutes
      availabilityDurationMinutes
      availabilityDurationUnit
      reminderMinutes
      reminderUnit
    }
  }
  independentEvaluationTemplates {
    id
    assessmentTypeId
    questionnaireIds
    questionnaireBundleIds
    randomizationRuleIds
    relativeDay
    relativeMinuteOfDay
    startMinuteOfDay
    durationMinutes
    endMinuteOfDay
    triggerMode
    availabilityDurationMinutes
    availabilityDurationUnit
    reminderMinutes
    reminderUnit
    required
    singleResponse
    seedOrder
    informantType
    defaultResponderRole
  }
`;

const createEvaluationScheme = gql`
  mutation($scheme: CreateEvaluationSchemeInput!) {
    createEvaluationScheme(scheme: $scheme) {
      ${schemeFields}
    }
  }
`;

const updateEvaluationScheme = gql`
  mutation($scheme: UpdateEvaluationSchemeInput!) {
    updateEvaluationScheme(scheme: $scheme) {
      ${schemeFields}
    }
  }
`;

const deleteEvaluationScheme = gql`
  mutation($id: Int!) {
    deleteEvaluationScheme(id: $id)
  }
`;

const applyEvaluationScheme = gql`
  mutation($assignment: ApplyEvaluationSchemeInput!) {
    applyEvaluationScheme(assignment: $assignment) {
      id
      schemeId
      randomizationRuleId
      patientId
      targetUserId
      therapistId
      supervisorId
      responderUserId
      clinicianId
      startDate
      timezone
      status
    }
  }
`;

const regenerateFutureSchemeOccurrences = gql`
  mutation($generation: RegenerateFutureSchemeOccurrencesInput!) {
    regenerateFutureSchemeOccurrences(generation: $generation) {
      id
      title
      startAt
      endAt
      occurrenceType
      isDetachedFromTemplate
    }
  }
`;

const addSchemeSessionTemplate = gql`
  mutation($sessionTemplate: SchemeSessionTemplateInput!) {
    addSchemeSessionTemplate(sessionTemplate: $sessionTemplate) {
      id
      sessionKind
      sessionIndex
      title
      relativeOffsetDays
      durationMinutes
      resourceTemplates {
        id
        resourceKind
        assessmentTypeId
        name
        questionnaireIds
        questionnaireBundleIds
        randomizationRuleIds
        sessionSelector
        everyNSessions
        startSessionNumber
        endSessionNumber
        activationAnchor
        activationOffsetMinutes
        availabilityDurationMinutes
        reminderMinutes
        defaultResponderRole
      }
    }
  }
`;

const addSchemeResourceTemplate = gql`
  mutation($resourceTemplate: AddSchemeResourceTemplateInput!) {
    addSchemeResourceTemplate(resourceTemplate: $resourceTemplate) {
      id
      sessionTemplateId
      resourceKind
      assessmentTypeId
      name
      questionnaireIds
      questionnaireBundleIds
      randomizationRuleIds
      sessionSelector
      everyNSessions
      startSessionNumber
      endSessionNumber
      informantType
      defaultResponderRole
      activationAnchor
      activationOffsetMinutes
      availabilityDurationMinutes
      reminderMinutes
    }
  }
`;

const updateSchemeResourceTemplate = gql`
  mutation($resourceTemplate: UpdateSchemeResourceTemplateInput!) {
    updateSchemeResourceTemplate(resourceTemplate: $resourceTemplate) {
      id
      sessionTemplateId
      resourceKind
      assessmentTypeId
      name
      questionnaireIds
      questionnaireBundleIds
      randomizationRuleIds
      sessionSelector
      everyNSessions
      startSessionNumber
      endSessionNumber
      informantType
      defaultResponderRole
      activationAnchor
      activationOffsetMinutes
      availabilityDurationMinutes
      reminderMinutes
    }
  }
`;

const deleteSchemeResourceTemplate = gql`
  mutation($id: Int!) {
    deleteSchemeResourceTemplate(id: $id)
  }
`;

const addIndependentEvaluationTemplate = gql`
  mutation($evaluationTemplate: IndependentEvaluationTemplateInput!) {
    addIndependentEvaluationTemplate(evaluationTemplate: $evaluationTemplate) {
      id
      assessmentTypeId
      name
      questionnaireIds
      questionnaireBundleIds
      randomizationRuleIds
      relativeDay
      relativeMinuteOfDay
      startMinuteOfDay
      durationMinutes
      endMinuteOfDay
      triggerMode
      availabilityDurationMinutes
      reminderMinutes
      required
      singleResponse
      seedOrder
      informantType
      defaultResponderRole
    }
  }
`;

const updateIndependentEvaluationTemplate = gql`
  mutation($evaluationTemplate: UpdateIndependentEvaluationTemplateInput!) {
    updateIndependentEvaluationTemplate(evaluationTemplate: $evaluationTemplate) {
      id
      assessmentTypeId
      name
      questionnaireIds
      questionnaireBundleIds
      randomizationRuleIds
      relativeDay
      relativeMinuteOfDay
      startMinuteOfDay
      durationMinutes
      endMinuteOfDay
      triggerMode
      availabilityDurationMinutes
      reminderMinutes
      required
      singleResponse
      seedOrder
      informantType
      defaultResponderRole
    }
  }
`;

const deleteIndependentEvaluationTemplate = gql`
  mutation($id: Int!) {
    deleteIndependentEvaluationTemplate(id: $id)
  }
`;

const clearIndependentEvaluationTemplates = gql`
  mutation($schemeId: Int!) {
    clearIndependentEvaluationTemplates(schemeId: $schemeId)
  }
`;

export const EvaluationSchemesMutations = {
  createEvaluationScheme,
  updateEvaluationScheme,
  deleteEvaluationScheme,
  applyEvaluationScheme,
  regenerateFutureSchemeOccurrences,
  addSchemeSessionTemplate,
  addSchemeResourceTemplate,
  updateSchemeResourceTemplate,
  deleteSchemeResourceTemplate,
  addIndependentEvaluationTemplate,
  updateIndependentEvaluationTemplate,
  deleteIndependentEvaluationTemplate,
  clearIndependentEvaluationTemplates,
};
