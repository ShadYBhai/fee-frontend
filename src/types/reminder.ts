export interface Reminder {
  id: string;
  student_id: string;
  owner_id: string;
  fee_record_id: string;
  sent_at: string;
  channel: string;
  message: string | null;
  student?: { id: string; name: string };
}

export interface ReminderResult {
  reminder_id?: string;
  student_id: string;
  student_name: string;
  parent_mobile: string;
  amount_pending: number;
  message: string;
  whatsapp_link: string;
}

export interface BulkReminderResult {
  count: number;
  reminders: ReminderResult[];
}

export interface MonthlySummaryStudent {
  student_id: string;
  student_name: string;
  parent_mobile: string;
  batch_name: string | null;
  fee_record_id: string;
  status: string;
  amount_due: number;
  discount: number;
  amount_paid: number;
  balance: number;
  whatsapp_link: string;
}

export interface MonthlySummary {
  month: number;
  year: number;
  month_name: string;
  pending_count: number;
  total_pending: number;
  institute_name: string;
  students: MonthlySummaryStudent[];
}
