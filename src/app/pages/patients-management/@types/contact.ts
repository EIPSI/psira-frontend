export interface Contact {
  id?: number;
  patientId?: number;
  caregiverId?: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  relation: string;
  emergency: boolean;
  note: string;
  createCaregiver?: boolean;
}

export interface UpdateOneEmergencyContactInput {
  id: number;
  update: UpdateEmergencyContact;
}

export interface UpdateEmergencyContact {
  patientId?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  caregiverId?: number;
}
