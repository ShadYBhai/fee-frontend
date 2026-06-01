import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as remindersApi from '@/api/reminders.api';

export const REMINDERS_KEY = ['reminders'] as const;

export function useReminders(params?: { student_id?: string; page?: number }) {
  return useQuery({
    queryKey: [...REMINDERS_KEY, params],
    queryFn: () => remindersApi.listReminders(params),
  });
}

export function useGenerateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ student_id, fee_record_id }: { student_id: string; fee_record_id: string }) =>
      remindersApi.generateReminder(student_id, fee_record_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
    onError: (err: { displayMessage?: string }) =>
      toast.error(err.displayMessage ?? 'Could not generate reminder.'),
  });
}

export function useGenerateBulkReminders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      remindersApi.generateBulkReminders(month, year),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
    onError: (err: { displayMessage?: string }) =>
      toast.error(err.displayMessage ?? 'Could not generate bulk reminders.'),
  });
}
