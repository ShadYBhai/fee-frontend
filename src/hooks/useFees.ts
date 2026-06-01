import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as feesApi from '@/api/fees.api';
import type { RecordFeeInput, UpdateFeeInput, FeeStatus } from '@/types/fee';

export const FEES_KEY = ['fees'] as const;

export function useFees(params?: { student_id?: string; status?: FeeStatus; month?: number; year?: number; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...FEES_KEY, params],
    queryFn: () => feesApi.listFees(params),
    enabled: params !== undefined,
  });
}

export function useFeeRecord(id: string) {
  return useQuery({
    queryKey: [...FEES_KEY, id],
    queryFn: () => feesApi.getFeeRecord(id),
    enabled: !!id,
  });
}

export function useRecordFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordFeeInput) => feesApi.recordFee(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEES_KEY });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: { displayMessage?: string }) =>
      toast.error(err.displayMessage ?? 'Could not record payment.'),
  });
}

export function useUpdateFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeeInput }) =>
      feesApi.updateFeeRecord(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: FEES_KEY });
      qc.invalidateQueries({ queryKey: [...FEES_KEY, id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Payment updated.');
    },
    onError: (err: { displayMessage?: string }) =>
      toast.error(err.displayMessage ?? 'Could not update payment.'),
  });
}
