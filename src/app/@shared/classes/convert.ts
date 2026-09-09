import { Assessment } from '@app/pages/assessment/@types/assessment';
import { Permission } from '@app/pages/administration/@types/permission';
import { Role } from '@app/pages/administration/@types/role';
import { Department } from '@app/pages/administration/@types/department';
import { FormattedDepartment } from '../../pages/administration/@types/department';
import { FormattedAssessment, FullAssessment, AssessmentStatus } from '../../pages/assessment/@types/assessment';
import {
  QuestionnaireVersion,
  FormattedQuestionnaireVersion,
  QuestionnaireStatus,
} from '../../pages/questionnaire-management/@types/questionnaire';
import { Reports } from '@app/pages/administration/@types/reports';
import { DisclaimerEnum, Disclaimers, FormattedDisclaimer } from '@app/pages/administration/@types/disclaimers';
import {
  AssessmentAdministration,
  AssessmentAdministrationStatus,
  FormattedAssessmentAdministration,
} from '@app/pages/administration/@types/assessment-administration';
import { formatSystemDate, formatSystemDateTime } from '@shared/utils/system-settings.util';

const STATUS_COLOR = {
  [QuestionnaireStatus.DRAFT]: 'blue',
  [QuestionnaireStatus.PRIVATE]: 'orange',
  [QuestionnaireStatus.PUBLISHED]: 'green',
  [QuestionnaireStatus.ARCHIVED]: 'red',
};

const ASSESSMENT_STATUS_COLOR = {
  [AssessmentStatus.PLANNED]: 'grey',
  OPEN_FOR_COMPLETION: 'black',
  PARTIALLY_COMPLETED: 'blue',
  [AssessmentStatus.COMPLETED]: 'green',
  [AssessmentStatus.CANCELLED]: 'red',
  [AssessmentStatus.EXPIRED]: 'orange',
};

export class Convert {
  // Permission
  public static toPermission(json: any): Permission {
    json.createdAt = json.createdAt ? formatSystemDateTime(json.createdAt) : '';
    return json;
  }

  public static toReport(json: any): Reports {
    json.createdAt = json.createdAt ? formatSystemDate(json.createdAt) : '';
    return json;
  }

  public static permissionToJson(value: Permission): string {
    return JSON.stringify(value);
  }

  // AssessmentAdministation

  public static toAssessmentAdministration(json: any): FormattedAssessmentAdministration {
    json.formattedStatus = {
      color: json.status === AssessmentAdministrationStatus.ACTIVE ? 'green' : 'orange',
      title: json.status === AssessmentAdministrationStatus.ACTIVE ? 'ACTIVE' : 'INACTIVE',
    };
    json.updatedAt = json.updatedAt ? formatSystemDate(json.updatedAt) : '';
    return json;
  }

  // Role
  public static toRole(json: any): Role {
    json.createdAt = json.createdAt ? formatSystemDateTime(json.createdAt) : '';
    return json;
  }

  public static roleToJson(value: Role): string {
    return JSON.stringify(value);
  }

  // Disclaimer

  public static toDisclaimer(json: any): Disclaimers {
    return json;
  }

  // Department
  public static toDepartment(json: any): FormattedDepartment {
    json.formattedStatus = {
      color: json.active ? 'green' : 'orange',
      title: json.active ? 'ACTIVE' : 'INACTIVE',
    };
    const roleLabel = (code: string): string =>
      ({
        SUPER_ADMIN: 'Super admin',
        SUPERVISOR: 'Supervisor',
        DEPARTMENT_ADMIN: 'Coordinador de departamento',
        THERAPIST: 'Terapeuta',
        CAREGIVER: 'Cuidador',
        PATIENT: 'Paciente',
        NO_ROLE: 'Sin rol',
      }[code] || code);
    json.formattedAppliedRoles = json.appliedRoleCodes?.length
      ? json.appliedRoleCodes.map(roleLabel).join(', ')
      : 'Todos';
    json.formattedDefaultRoles = json.defaultRoleCodes?.length
      ? json.defaultRoleCodes.map(roleLabel).join(', ')
      : '-';
    return json;
  }

  public static departmentToJson(value: Department): string {
    return JSON.stringify(value);
  }

  public static toFormattedQuestionnaireVersion(json: QuestionnaireVersion): FormattedQuestionnaireVersion {
    const questionnaire: FormattedQuestionnaireVersion = json as FormattedQuestionnaireVersion;

    questionnaire.formattedStatus = {
      color: STATUS_COLOR[questionnaire.status],
      title: questionnaire.status,
    };

    // questionnaire.language = json.questionnaire.language;
    // questionnaire.abbreviation = json.questionnaire.abbreviation;

    return questionnaire;
  }

  public static toFormattedQuestionnaireVersion2(json: QuestionnaireVersion): FormattedQuestionnaireVersion {
    const questionnaire: FormattedQuestionnaireVersion = json as FormattedQuestionnaireVersion;

    questionnaire.formattedStatus = {
      color: ASSESSMENT_STATUS_COLOR[AssessmentStatus.PLANNED],
      title: '',
      translationPath: 'questionnaires.oldVersion',
    };

    return questionnaire;
  }

  public static toFormattedDisclaimer(json: Disclaimers): FormattedDisclaimer {
    json.updatedAt = json.updatedAt ? formatSystemDate(json.updatedAt) : '';
    const disclaimer: FormattedDisclaimer = json as FormattedDisclaimer;
    disclaimer.formattedType = DisclaimerEnum[disclaimer.type];
    return json;
  }

  public static toFormattedAssessment(json: Assessment | FullAssessment): FormattedAssessment {
    const assessment: FormattedAssessment = json as FormattedAssessment;

    assessment.formatedQuestionnaires = json?.questionnaireAssessment?.questionnaires.map((questionnaire: any) => [
      questionnaire?.questionnaire?.abbreviation,
    ]);

    assessment.formatedQuestionnaireNames = json?.questionnaireAssessment?.questionnaires.map((questionnaire: any) => [
      `${questionnaire?.name}` + ' ' + '(' + questionnaire?.abbreviation + ')',
    ]);

    assessment.emailFormatedStatus = {
      color:
        json.emailStatus === 'SCHEDULED'
          ? 'green'
          : json.emailStatus === 'NOT_SCHEDULED'
          ? 'orange'
          : json.emailStatus === 'FAILED'
          ? 'red'
          : json.emailStatus === 'NOT_SENT'
          ? 'gray'
          : 'blue',
      title:
        json.emailStatus === 'SCHEDULED'
          ? 'SCHEDULED'
          : json.emailStatus === 'NOT_SCHEDULED'
          ? 'NOT SCHEDULED'
          : json.emailStatus === 'NOT_SENT'
          ? 'NOT SENT'
          : json.emailStatus === 'SENT'
          ? 'SENT'
          : 'FAILED',
    };

    assessment.formattedPatient = [
      json.patient?.firstName || json.targetUser?.firstName,
      json.patient?.middleName || json.targetUser?.middleName,
      json.patient?.lastName || json.targetUser?.lastName,
    ]
      .filter((s) => !!s)
      .join(' ');

    assessment.formattedClinician = [json.clinician?.firstName, json.clinician?.middleName, json.clinician?.lastName]
      .filter((s) => !!s)
      .join(' ');
    if (isFullAssessment(json)) {
      assessment.formattedStatus = {
        color: ASSESSMENT_STATUS_COLOR[json.questionnaireAssessment.status],
        title: AssessmentStatus[json.questionnaireAssessment.status],
      };
    }

    assessment.patientMedicalRecordNo = assessment.patient?.medicalRecordNo || assessment.targetUser?.workID;
    assessment.clinicianWorkId = assessment.clinician?.workID;

    assessment.formatedDeliveryDate = assessment.deliveryDate ? formatSystemDate(assessment.deliveryDate) : '';
    assessment.formatedExpirationDate = assessment.expirationDate ? formatSystemDate(assessment.expirationDate) : '';

    if (json.informantClinician) {
      assessment.informantType = json.informantClinician.firstName;
    } else if (json.informantCaregiverRelation) {
      assessment.informantType = json.informantCaregiverRelation;
    } else {
      assessment.informantType = 'Patient';
    }

    assessment.formattedAssessmentType = assessment.assessmentType?.name;
    assessment.formattedOrigin = {
      color:
        assessment.origin === 'SESSION_BASED'
          ? 'purple'
          : assessment.origin === 'FIXED_SCHEME'
          ? 'cyan'
          : 'blue',
      title:
        assessment.origin === 'SESSION_BASED'
          ? 'Sesión'
          : assessment.origin === 'FIXED_SCHEME'
          ? 'Esquema fijo'
          : 'Individual',
    };
    assessment.linkedSessionLabel = assessment.clinicalSession
      ? [
          assessment.clinicalSession.sessionKind === 'SUPERVISION' ? 'Supervisión' : 'Sesión',
          assessment.clinicalSession.sessionNumber ? `#${assessment.clinicalSession.sessionNumber}` : '',
          assessment.clinicalSession.calendarOccurrence?.startAt
            ? formatSystemDateTime(assessment.clinicalSession.calendarOccurrence.startAt)
            : '',
        ]
          .filter((s) => !!s)
          .join(' ')
      : '';

    return assessment;
  }
}

const isFullAssessment = (json: Assessment | FullAssessment): json is FullAssessment =>
  !!(json as FullAssessment).questionnaireAssessment;
