export type StudentStatus = 'ACTIVE' | 'INACTIVE';

export interface Student {
  id: string;
  owner_id: string;
  batch_id: string | null;
  name: string;
  parent_mobile: string;
  default_fee: number;
  status: StudentStatus;
  admission_date: string;
  created_at: string;
  batch?: { id: string; name: string } | null;
}

export interface CreateStudentInput {
  name: string;
  parent_mobile: string;
  batch_id?: string;
  default_fee: number;
  admission_date?: string;
}

export interface UpdateStudentInput {
  name?: string;
  parent_mobile?: string;
  batch_id?: string | null;
  default_fee?: number;
}
