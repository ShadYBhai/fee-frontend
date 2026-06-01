import { api } from '@/lib/axios';
import type { Reminder, ReminderResult, BulkReminderResult } from '@/types/reminder';

export const listReminders = (params?: { student_id?: string; page?: number; limit?: number }) =>
  api.get<{ data: Reminder[]; pagination: unknown }>('/reminders', { params }).then((r) => r.data);

export const generateReminder = (student_id: string, fee_record_id: string) =>
  api.post<{ data: ReminderResult }>('/reminders/single', { student_id, fee_record_id }).then((r) => r.data.data);

export const generateBulkReminders = (month: number, year: number) =>
  api.post<{ data: BulkReminderResult }>('/reminders/bulk', { month, year }).then((r) => r.data.data);
