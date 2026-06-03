import axios from 'axios';
import { api } from '@/lib/axios';
import type { Reminder, ReminderResult, BulkReminderResult, MonthlySummary } from '@/types/reminder';

export const listReminders = (params?: { student_id?: string; page?: number; limit?: number }) =>
  api.get<{ data: Reminder[]; pagination: unknown }>('/reminders', { params }).then((r) => r.data);

export const generateReminder = (student_id: string, fee_record_id: string) =>
  api.post<{ data: ReminderResult }>('/reminders/single', { student_id, fee_record_id }).then((r) => r.data.data);

export const generateBulkReminders = (month: number, year: number) =>
  api.post<{ data: BulkReminderResult }>('/reminders/bulk', { month, year }).then((r) => r.data.data);

/** Fetch pending students for the month encoded in a magic token. No auth header needed. */
export const getMonthlySummary = (token: string) => {
  const baseURL = api.defaults.baseURL ?? '';
  return axios
    .get<{ data: MonthlySummary }>(`${baseURL}/reminders/monthly-summary`, { params: { token } })
    .then((r) => r.data.data);
};

/** CSV download URL for a magic token. */
export const getExportCsvUrl = (token: string) =>
  `${api.defaults.baseURL}/reminders/export-csv?token=${encodeURIComponent(token)}`;
