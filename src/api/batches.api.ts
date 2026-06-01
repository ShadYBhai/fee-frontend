import { api } from '@/lib/axios';
import type { Batch, CreateBatchInput, UpdateBatchInput } from '@/types/batch';

export const listBatches = () =>
  api.get<{ data: Batch[] }>('/batches').then((r) => r.data.data);

export const getBatch = (id: string) =>
  api.get<{ data: Batch }>(`/batches/${id}`).then((r) => r.data.data);

export const createBatch = (data: CreateBatchInput) =>
  api.post<{ data: Batch }>('/batches', data).then((r) => r.data.data);

export const updateBatch = (id: string, data: UpdateBatchInput) =>
  api.patch<{ data: Batch }>(`/batches/${id}`, data).then((r) => r.data.data);

export const deactivateBatch = (id: string) =>
  api.patch(`/batches/${id}/deactivate`).then((r) => r.data);
