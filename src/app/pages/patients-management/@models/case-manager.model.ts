import { CaseManager } from '../@types/case-manager';

export class CaseManagerModel {
  public static fromJson(json: any): CaseManager {
    json.formattedStatus = {
      color: json.active ? 'green' : 'orange',
      title: json.active ? 'ACTIVE' : 'INACTIVE',
    };

    json.formattedRoles = json.roles.map((role: { code: string; name: any }) => ({
      color: CaseManagerModel.roleColor(role.code),
      title: role.name,
    }));
    json.formattedDepartments = json.departments.map((dep: { name: any }) => ({ color: 'cyan', title: dep.name }));
    return json;
  }

  public static toJson(value: CaseManager): string {
    return JSON.stringify(value);
  }

  public static updateData(json: any): CaseManager {
    const excludedProperties = [
      'permissions',
      'roles',
      'updatedAt',
      'createdAt',
      'departments',
      'formattedDepartments',
      'formattedRoles',
      'formattedCreatedAt',
      'formattedUpdatedAt',
      'formattedBirthDate',
      'formattedStatus',
      '__typename',
    ];
    const user: CaseManager = {};
    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        if (!excludedProperties.includes(key)) {
          user[key] = json[key];
        }
      }
    }
    return user;
  }

  private static roleColor(roleCode: string): string {
    const colors: { [key: string]: string } = {
      THERAPIST: 'geekblue',
      SUPERVISOR: 'purple',
      CASE_MANAGER: 'green',
      ADMIN: 'red',
      PATIENT: 'cyan',
    };
    return colors[roleCode] || 'blue';
  }
}
