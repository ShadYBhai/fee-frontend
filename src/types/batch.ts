export type BatchStatus = 'ACTIVE' | 'INACTIVE';

export interface Batch {
  id: string;
  owner_id: string;
  name: string;
  timing: string | null;
  subject: string | null;
  status: BatchStatus;
  created_at: string;
  _count?: { students: number };
}

export interface CreateBatchInput {
  name: string;
  timing?: string;
  subject?: string;
}

export interface UpdateBatchInput {
  name?: string;
  timing?: string;
  subject?: string;
  status?: BatchStatus;
}
