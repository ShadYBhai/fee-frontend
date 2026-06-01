import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as batchesApi from '@/api/batches.api';
import type { CreateBatchInput, UpdateBatchInput } from '@/types/batch';

export const BATCHES_KEY = ['batches'] as const;

export function useBatches() {
  return useQuery({ queryKey: BATCHES_KEY, queryFn: batchesApi.listBatches });
}

export function useBatch(id: string) {
  return useQuery({
    queryKey: [...BATCHES_KEY, id],
    queryFn: () => batchesApi.getBatch(id),
    enabled: !!id,
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBatchInput) => batchesApi.createBatch(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BATCHES_KEY });
      toast.success('Batch created!');
    },
    onError: (err: { displayMessage?: string }) =>
      toast.error(err.displayMessage ?? 'Could not create batch.'),
  });
}

export function useUpdateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBatchInput }) =>
      batchesApi.updateBatch(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: BATCHES_KEY });
      qc.invalidateQueries({ queryKey: [...BATCHES_KEY, id] });
      toast.success('Batch updated.');
    },
    onError: (err: { displayMessage?: string }) =>
      toast.error(err.displayMessage ?? 'Could not update batch.'),
  });
}

export function useDeactivateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batchesApi.deactivateBatch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BATCHES_KEY });
      toast.success('Batch deactivated.');
    },
    onError: (err: { displayMessage?: string }) =>
      toast.error(err.displayMessage ?? 'Could not deactivate batch.'),
  });
}
