export enum PermissionKey {
  VIEW_PATIENTS = 'view patients',
  VIEW_ALL_PATIENTS = 'view all patients',
  VIEW_DEPARTMENT_PATIENTS = 'view department patients',
  VIEW_ASSIGNED_PATIENTS = 'view assigned patients',
  MANAGE_PATIENTS = 'manage patients',
  REMOVE_SELF_CASE_MANAGER = 'remove self case manager',
  DELETE_PATIENTS = 'delete patients',

  VIEW_ASSESSMENTS = 'view assessments',
  MANAGE_ASSESSMENTS = 'manage assessments',
  MANAGE_DEPARTMENT_ASSESSMENTS = 'manage department assessments',
  MANAGE_ALL_ASSESSMENTS = 'manage all assessments',
  ASSIGN_ANY_ASSESSMENT_USER = 'assign any assessment user',
  DELETE_ASSESSMENTS = 'delete assessments',
  VIEW_EVALUATION_AUTOMATIONS = 'view evaluation automations',
  VIEW_ALL_EVALUATION_AUTOMATIONS = 'view all evaluation automations',
  MANAGE_EVALUATION_AUTOMATIONS = 'manage evaluation automations',
  MANAGE_ALL_EVALUATION_AUTOMATIONS = 'manage all evaluation automations',
  VIEW_NOTIFICATIONS = 'view notifications',
  MANAGE_NOTIFICATIONS = 'manage notifications',
  VIEW_NOTIFICATION_LOGS = 'view notification logs',

  VIEW_USERS = 'view users',
  MANAGE_USERS = 'manage users',
  DELETE_USERS = 'delete users',

  VIEW_REPORTS = 'view reports',
  MANAGE_REPORTS = 'manage reports',
  DELETE_REPORTS = 'delete reports',

  VIEW_ROLES_PERMISSIONS = 'view roles_permissions',
  MANAGE_ROLES_PERMISSIONS = 'manage roles_permissions',

  VIEW_SYSCONF = 'view sysconf',
  MANAGE_SYSCONF = 'manage sysconf',

  VIEW_SETTINGS = 'view settings',
  MANAGE_SETTINGS = 'manage settings',

  VIEW_QUESTIONNAIRES = 'view questionnaires',
  MANAGE_QUESTIONNAIRES = 'manage questionnaires',
  DELETE_QUESTIONNAIRES = 'delete questionnaires',

  VIEW_TEMPLATES = 'view templates',
  MANAGE_TEMPLATES = 'manage templates',
  DELETE_TEMPLATES = 'delete templates'
}

export const isPermissionKey = (key: any): key is PermissionKey => {
  return Object.values(PermissionKey).includes(key);
};

export const isPermissionKeyArray = (arr: any): arr is PermissionKey[] => {
  return typeof arr === 'object' && Object.values(arr).every((key) => isPermissionKey(key));
};
