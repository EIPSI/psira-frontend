import { Component, OnInit } from '@angular/core';
import { Permission } from '@app/pages/administration/@types/permission';
import { Role } from '@app/pages/administration/@types/role';
import { PermissionsService } from '@app/pages/administration/@services/permissions.service';
import { Sorting } from '@shared/@types/sorting';
import { Paging } from '@shared/@types/paging';
import { Filter } from '@shared/@types/filter';
import { RolesService } from '@app/pages/administration/@services/roles.service';
import { AppPermissionsService } from '@shared/services/app-permissions.service';
import { PermissionKey } from '@app/@shared/@types/permission';
import { ErrorHandlerService } from '../../../@shared/services/error-handler.service';
import { finalize } from 'rxjs/operators';

interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

interface PermissionDetail {
  title: string;
  resource: string;
  action: string;
  scope: string;
  description: string;
  enabled: string[];
  limits: string[];
  examples: string[];
}

@Component({
  selector: 'app-roles-and-permissions',
  templateUrl: './roles-and-permissions.component.html',
  styleUrls: ['./roles-and-permissions.component.scss'],
})
export class RolesAndPermissionsComponent implements OnInit {
  PK = PermissionKey;
  loading = false;
  rolesPaging: Paging = {
    first: 50,
  };
  rolesPageInfo: any;
  permissionsPaging: Paging = {
    first: 50,
  };
  permissionsPageInfo: any;
  matrix: { roles: Role[]; permissions: Permission[] } = {
    roles: [],
    permissions: [],
  };
  permissionGroups: PermissionGroup[] = [];
  selectedPermissionDetail: PermissionDetail | null = null;
  permissionDetailVisible = false;

  private readonly groupOrder = [
    'User Management',
    'Patient Management',
    'Therapists',
    'Supervisors',
    'Caregiver Management',
    'Clinical Work',
    'Assessments',
    'Questionnaires',
    'Questionnaire Bundles',
    'Evaluation Schemes',
    'Randomizations',
    'Evaluation Automations',
    'Notifications',
    'Mail Templates',
    'Informed Consent',
    'Reports',
    'Departments',
    'Roles and Permissions',
    'System Configuration',
  ];

  private readonly resourceDescriptions: Record<string, string> = {
    users: 'usuarios generales del sistema, incluyendo su perfil, roles, departamentos, estado de cuenta y configuración administrativa.',
    patients: 'pacientes/casos clínicos, sus datos de caso, departamentos, administradores del caso, cuidadores, contactos, estado e información asociada.',
    therapists: 'usuarios terapeutas, sus datos de perfil profesional, vínculos de supervisión y disponibilidad de gestión como usuarios especiales.',
    supervisors: 'usuarios supervisores, sus datos de perfil y su capacidad de articular terapeutas o casos bajo supervisión.',
    caregivers: 'cuidadores vinculados a pacientes, siempre dependientes de un paciente y heredando el marco departamental del caso.',
    clinical: 'sesiones, supervisiones, calendario clínico, seguimiento clínico/de supervisión, cancelaciones, reestructuraciones y operaciones asociadas al trabajo clínico.',
    assessments: 'evaluaciones individuales, evaluaciones generadas por esquemas fijos, session-based, automatizaciones y sus operaciones de asignación, edición, descarte o archivo.',
    questionnaires: 'cuestionarios como unidad básica de evaluación, sus preguntas, respuestas y configuración interna.',
    'questionnaire-bundles': 'paquetes de cuestionarios, pantallas de presentación, randomización interna y experiencia secuencial de respuesta.',
    'evaluation-schemes': 'esquemas de evaluación fijos o vinculados a sesiones, sus reglas de aplicación y propagación.',
    randomizations: 'reglas de randomización y asignación aleatoria de contenidos o condiciones.',
    automations: 'automatizaciones configuradas por eventos, condiciones, departamentos, motivos y acciones clínicas o administrativas.',
    notifications: 'configuración de notificaciones del sistema por evento, rol, departamento, canal y preferencias.',
    'notification-logs': 'historial técnico de notificaciones emitidas, intentos de envío, estado y auditoría.',
    'mail-templates': 'modelos de email, variables, emisor, contenido enriquecido y versiones usadas por notificaciones.',
    'informed-consent-models': 'modelos de consentimiento informado, bloques de texto/pregunta, versiones y previsualizaciones.',
    'informed-consent-management': 'gestión de cuándo, a quién y bajo qué condiciones aplica cada consentimiento informado.',
    'informed-consent-responses': 'respuestas, revisiones, rehabilitaciones y auditoría de consentimientos informados respondidos por usuarios.',
    reports: 'informes generados o configurados para pacientes, usuarios, evaluaciones y otras secciones clínicas o administrativas.',
    departments: 'departamentos, sus reglas de aplicación por rol, colores, defaults y estructura institucional.',
    roles: 'roles del sistema, jerarquía, permisos asignados y capacidad de edición de perfiles de acceso.',
    permissions: 'asignación de permisos a roles dentro de la matriz de permisos de usuarios.',
    settings: 'ajustes configurables de PSIRA que afectan comportamiento clínico, formatos, limpieza y parámetros generales.',
    system: 'configuración global del sistema, activación de módulos y parámetros absolutos de plataforma.',
  };

  private readonly actionDescriptions: Record<string, string> = {
    view: 'permite consultar, listar, abrir detalle y usar la información como lectura dentro de las pantallas autorizadas.',
    create: 'permite crear nuevos registros o programaciones de este recurso, respetando las validaciones propias del módulo.',
    edit: 'permite modificar registros existentes, actualizar vínculos, cambiar configuración o ejecutar acciones equivalentes de mantenimiento.',
    delete: 'permite eliminar registros cuando el módulo lo permite, incluyendo operaciones de baja definitiva o eliminación lógica según la entidad.',
    archive: 'permite archivar registros, quitarlos del flujo operativo principal sin perder el registro histórico.',
    restore: 'permite restaurar registros archivados, eliminados lógicamente o dados de baja cuando el módulo conserva historial.',
    assign: 'permite asignar responsables, destinatarios o vínculos operativos relacionados con evaluaciones.',
    review: 'permite revisar respuestas, rehabilitar estados, registrar decisiones administrativas y operar auditoría de consentimientos.',
    test: 'permite probar reglas o ejecuciones de automatizaciones sin que eso implique necesariamente crear una automatización nueva.',
  };

  private readonly scopeDescriptions: Record<string, string> = {
    all: 'alcance absoluto. Aplica sobre todos los departamentos, usuarios, casos y registros del recurso. Está pensado para super administración o permisos administrativos globales.',
    department: 'alcance departamental. Aplica solo sobre departamentos a los que pertenece el usuario o sobre registros vinculados a esos departamentos.',
    'department-hierarchy': 'alcance departamental con jerarquía. Aplica dentro de los departamentos permitidos y además respeta que el usuario solo pueda operar roles o usuarios de jerarquía igual o inferior.',
    assigned: 'alcance asignado. Aplica solo sobre casos, terapeutas, cuidadores, sesiones, evaluaciones o respuestas donde el usuario participa como responsable, administrador del caso, supervisor o usuario vinculado.',
  };

  constructor(
    private rolesService: RolesService,
    private permissionService: PermissionsService,
    private errorService: ErrorHandlerService,
    public perms: AppPermissionsService
  ) {}

  ngOnInit(): void {
    this.getPermissions();
    this.getRoles({ paging: this.rolesPaging });
  }

  getPermissions(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting | Sorting[] }) {
    this.loading = true;
    this.loadPermissionPage(params ?? { paging: this.permissionsPaging }, []);
  }

  getRoles(params?: { paging?: Paging; filter?: Filter; sorting?: Sorting }) {
    this.loading = true;
    const roles: Role[] = [];
    this.rolesService
      .roles(params)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ({ data }: any) => {
          data.roles.edges.map((role: any) => {
            roles.push(role.node);
          });
          this.matrix.roles = roles;
          this.rolesPaging.after = data.roles.pageInfo.endCursor;
          this.rolesPaging.before = data.roles.pageInfo.startCursor;
          this.rolesPageInfo = data.roles.pageInfo;
        },
        (error) => this.errorService.handleError(error, { prefix: 'Unable to load roles' })
      );
  }

  permissionInRole(permission: Permission, role: Role): boolean {
    const permIds: number[] = (role.permissions ?? []).map((perm) => perm.id);
    return permIds.includes(permission.id);
  }

  getUserPermissions(permission: PermissionKey): boolean {
    return this.perms.permissionsOnly(permission);
  }

  assignPermissionToRole(permission: Permission, role: Role, checked: boolean) {
    this.loading = true;
    if (checked) {
      this.rolesService
        .addPermissionsToRole(role.id, [permission.id])
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(
          () => {
            role.permissions = [...(role.permissions ?? []), permission];
          },
          (error: any) =>
            this.errorService.handleError(error, {
              prefix: `Unable to assign permission "${permission.name}" to role "${role.name}"`,
            })
        );
    } else {
      this.rolesService
        .removePermissionsFromRole(role.id, [permission.id])
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(
          () => {
            role.permissions = role.permissions?.filter((rolePermission) => rolePermission.id !== permission.id) ?? [];
          },
          (error: any) =>
            this.errorService.handleError(error, {
              prefix: `Unable to remove permission "${permission.name}" from role "${role.name}"`,
            })
        );
    }
  }

  openPermissionDetail(permission: Permission): void {
    this.selectedPermissionDetail = this.buildPermissionDetail(permission);
    this.permissionDetailVisible = true;
  }

  private loadPermissionPage(params: { paging?: Paging; filter?: Filter; sorting?: Sorting | Sorting[] }, collected: Permission[]): void {
    const paging = params.paging ?? { first: 50 };
    this.permissionService
      .permissions({
        ...params,
        paging: { ...paging, first: 50 },
        sorting: params.sorting ?? [{ field: 'group', direction: 'ASC' }, { field: 'name', direction: 'ASC' }],
      })
      .subscribe(
        ({ data }) => {
          const nextPermissions = [
            ...collected,
            ...data.permissions.edges.map((permission: any) => permission.node as Permission),
          ];
          const pageInfo = data.permissions.pageInfo;
          if (pageInfo.hasNextPage) {
            this.loadPermissionPage(
              {
                ...params,
                paging: { first: 50, after: pageInfo.endCursor },
              },
              nextPermissions,
            );
            return;
          }

          this.matrix.permissions = nextPermissions;
          this.permissionGroups = this.groupPermissions(nextPermissions);
          this.permissionsPaging.after = pageInfo.endCursor;
          this.permissionsPaging.before = pageInfo.startCursor;
          this.permissionsPageInfo = pageInfo;
          this.loading = false;
        },
        (error) => {
          this.loading = false;
          this.errorService.handleError(error, { prefix: 'Unable to load permissions' });
        },
      );
  }

  private groupPermissions(permissions: Permission[]): PermissionGroup[] {
    const groups = new Map<string, Permission[]>();
    permissions.forEach((permission) => {
      const group = permission.group || 'Other';
      groups.set(group, [...(groups.get(group) ?? []), permission]);
    });

    return [...groups.entries()]
      .sort(([a], [b]) => {
        const aIndex = this.groupOrder.indexOf(a);
        const bIndex = this.groupOrder.indexOf(b);
        if (aIndex >= 0 || bIndex >= 0) return (aIndex >= 0 ? aIndex : 999) - (bIndex >= 0 ? bIndex : 999);
        return a.localeCompare(b);
      })
      .map(([name, groupPermissions]) => ({
        name,
        permissions: groupPermissions.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }

  private buildPermissionDetail(permission: Permission): PermissionDetail {
    const [resource, action, scope] = String(permission.name).split('.');
    const resourceDescription = this.resourceDescriptions[resource] || `el recurso tecnico "${resource}".`;
    const actionDescription = this.actionDescriptions[action] || `habilita la accion tecnica "${action}".`;
    const scopeDescription = this.scopeDescriptions[scope] || `alcance tecnico "${scope}".`;

    return {
      title: String(permission.name),
      resource,
      action,
      scope,
      description: `Este permiso controla si un usuario puede operar sobre ${resourceDescription} La accion asociada ${actionDescription} El alcance definido es: ${scopeDescription}`,
      enabled: [
        `Permite ejecutar la accion "${action}" sobre ${resourceDescription}`,
        'Permite que menus, rutas, botones y resolvers asociados a esta accion queden disponibles cuando el alcance coincide.',
        'Cuando el permiso es de alcance all, tambien cubre permisos mas acotados del mismo recurso y accion en los guards del sistema.',
      ],
      limits: [
        'No saltea validaciones clinicas, reglas de negocio, integridad de datos ni restricciones propias de cada modulo.',
        'No otorga automaticamente permisos sobre otros recursos aunque esten relacionados funcionalmente.',
        'Los alcances department, department-hierarchy y assigned requieren que el registro este efectivamente dentro del departamento, jerarquia o vinculacion correspondiente.',
      ],
      examples: [
        `${resource}.${action}.all habilita esta accion en todo PSIRA para ese recurso.`,
        `${resource}.${action}.department habilita esta accion solo dentro de los departamentos permitidos.`,
        `${resource}.${action}.assigned habilita esta accion solo cuando el usuario participa directamente en el caso, sesion, evaluacion o respuesta.`,
      ].filter((example) => !example.includes('undefined')),
    };
  }
}
