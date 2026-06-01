import { api } from '@/lib/axios';
import type { FeeRecord, RecordFeeInput, UpdateFeeInput } from '@/types/fee';
import type { FeeStatus } from '@/types/fee';

interface ListFeesParams { student_id?: string; status?: FeeStatus; month?: number; year?: number; page?: number; limit?: number; }

export const listFees = (params?: ListFeesParams) =>
  api.get<{ data: FeeRecord[]; pagination: unknown }>('/fees', { params }).then((r) => r.data);

export const getFeeRecord = (id: string) =>
  api.get<{ data: FeeRecord }>(`/fees/${id}`).then((r) => r.data.data);

export const recordFee = (data: RecordFeeInput) =>
  api.post<{ data: FeeRecord }>('/fees', data).then((r) => r.data.data);

export const updateFeeRecord = (id: string, data: UpdateFeeInput) =>
  api.patch<{ data: FeeRecord }>(`/fees/${id}`, data).then((r) => r.data.data);

export const getReceiptUrl = (id: string) =>
  `${api.defaults.baseURL}/fees/${id}/receipt`;
