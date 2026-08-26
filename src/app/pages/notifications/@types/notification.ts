export enum NotificationChannel {
  EMAIL = 'EMAIL',
}

export enum NotificationFamily {
  ASSESSMENT = 'ASSESSMENT',
  CASE = 'CASE',
  AUTOMATION = 'AUTOMATION',
}

export enum NotificationEvent {
  ASSESSMENT_ASSIGNED = 'ASSESSMENT_ASSIGNED',
  ASSESSMENT_REMINDER = 'ASSESSMENT_REMINDER',
  ASSESSMENT_ANSWERED = 'ASSESSMENT_ANSWERED',
  ASSESSMENT_NOT_ANSWERED = 'ASSESSMENT_NOT_ANSWERED',
  ASSESSMENT_PERIODIC_SUMMARY = 'ASSESSMENT_PERIODIC_SUMMARY',
  CASE_UPDATED = 'CASE_UPDATED',
  USER_CREATED = 'USER_CREATED',
  FIRST_LOGIN = 'FIRST_LOGIN',
  LAST_LOGIN = 'LAST_LOGIN',
  SESSION_NUMBER = 'SESSION_NUMBER',
  TREATMENT_FINALIZATION = 'TREATMENT_FINALIZATION',
  SESSION_NO_SHOW_CANCELLATION = 'SESSION_NO_SHOW_CANCELLATION',
  NEW_TREATMENT = 'NEW_TREATMENT',
}

export enum NotificationPeriodicUnit {
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
  MONTHS = 'MONTHS',
}

export const NotificationChannelLabel: Record<NotificationChannel, string> = {
  [NotificationChannel.EMAIL]: 'Email',
};

export const NotificationFamilyLabel: Record<NotificationFamily, string> = {
  [NotificationFamily.ASSESSMENT]: 'Evaluaciones',
  [NotificationFamily.CASE]: 'Caso',
  [NotificationFamily.AUTOMATION]: 'Automatizaciones',
};

export const NotificationEventLabel: Record<NotificationEvent, string> = {
  [NotificationEvent.ASSESSMENT_ASSIGNED]: 'Evaluación asignada',
  [NotificationEvent.ASSESSMENT_REMINDER]: 'Recordatorio de evaluación',
  [NotificationEvent.ASSESSMENT_ANSWERED]: 'Evaluación respondida',
  [NotificationEvent.ASSESSMENT_NOT_ANSWERED]: 'Evaluación no respondida',
  [NotificationEvent.ASSESSMENT_PERIODIC_SUMMARY]: 'Resumen periódico de evaluaciones',
  [NotificationEvent.CASE_UPDATED]: 'Actualización del caso',
  [NotificationEvent.USER_CREATED]: 'Creación de usuario',
  [NotificationEvent.FIRST_LOGIN]: 'Primer login',
  [NotificationEvent.LAST_LOGIN]: 'Último login',
  [NotificationEvent.SESSION_NUMBER]: 'Sesión X',
  [NotificationEvent.TREATMENT_FINALIZATION]: 'Finalización de tratamiento',
  [NotificationEvent.SESSION_NO_SHOW_CANCELLATION]: 'Cancelación por falta',
  [NotificationEvent.NEW_TREATMENT]: 'Nuevo tratamiento',
};

export const NotificationEventDescription: Record<NotificationEvent, string> = {
  [NotificationEvent.ASSESSMENT_ASSIGNED]:
    'Email que recibe la persona que debe responder una evaluación cuando se le asigna una nueva evaluación.',
  [NotificationEvent.ASSESSMENT_REMINDER]:
    'Email que recibe la persona que debe responder una evaluación cuando se cumple uno de los recordatorios configurados y la evaluación sigue pendiente.',
  [NotificationEvent.ASSESSMENT_ANSWERED]:
    'Aviso para responsables del caso cuando una evaluación fue respondida.',
  [NotificationEvent.ASSESSMENT_NOT_ANSWERED]:
    'Aviso para responsables del caso cuando una evaluación queda pendiente o no fue respondida en el plazo esperado.',
  [NotificationEvent.ASSESSMENT_PERIODIC_SUMMARY]:
    'Resumen agrupado de evaluaciones respondidas y pendientes durante el período configurado.',
  [NotificationEvent.CASE_UPDATED]:
    'Aviso genérico para cambios relevantes en el caso, el tratamiento o la supervisión.',
  [NotificationEvent.USER_CREATED]:
    'Evento disponible cuando se crea un usuario nuevo en PSIRA.',
  [NotificationEvent.FIRST_LOGIN]:
    'Evento disponible cuando un usuario ingresa por primera vez al sistema.',
  [NotificationEvent.LAST_LOGIN]:
    'Evento disponible para reglas vinculadas con inactividad o último ingreso al sistema.',
  [NotificationEvent.SESSION_NUMBER]:
    'Evento disponible para automatizaciones que se activan en una sesión específica.',
  [NotificationEvent.TREATMENT_FINALIZATION]:
    'Evento disponible cuando se registra la finalización de un tratamiento o supervisión.',
  [NotificationEvent.SESSION_NO_SHOW_CANCELLATION]:
    'Evento disponible cuando una sesión se cancela por falta.',
  [NotificationEvent.NEW_TREATMENT]:
    'Evento disponible cuando se registra un nuevo tratamiento o una nueva supervisión.',
};

export const NotificationPeriodicUnitLabel: Record<NotificationPeriodicUnit, string> = {
  [NotificationPeriodicUnit.DAYS]: 'Días',
  [NotificationPeriodicUnit.WEEKS]: 'Semanas',
  [NotificationPeriodicUnit.MONTHS]: 'Meses',
};

export interface NotificationConfiguration {
  id: number;
  departmentId?: number;
  channel: NotificationChannel;
  family: NotificationFamily;
  event: NotificationEvent;
  recipientRoleId: number;
  mailTemplateId?: number;
  active: boolean;
  notes?: string;
  department?: { id: number; name: string };
  recipientRole?: { id: number; name: string; code?: string };
  mailTemplate?: { id: number; name: string; subject?: string };
  departmentName?: string;
  channelLabel?: string;
  familyLabel?: string;
  eventLabel?: string;
  recipientRoleName?: string;
  mailTemplateName?: string;
  formattedChannel?: { title: string; color: string };
  formattedEvent?: { title: string; color: string };
  formattedStatus?: { title: string; color: string };
}

export interface NotificationTemplateShortcut {
  group: string;
  label: string;
  token: string;
  description: string;
}

export interface NotificationPreference {
  id: number;
  patientId?: number;
  therapistId?: number;
  userId?: number;
  enabled: boolean;
  immediateEnabled: boolean;
  periodicEnabled: boolean;
  periodicEvery: number;
  periodicUnit: NotificationPeriodicUnit;
  enabledEvents?: NotificationEvent[];
  excludedRecipientIds?: number[];
  lastPeriodicSentAt?: string;
}
