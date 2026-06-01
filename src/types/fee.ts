export type FeeStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER';

export interface FeeRecord {
  id: string;
  student_id: string;
  owner_id: string;
  month_from: number;
  year_from: number;
  month_to: number;
  year_to: number;
  months_covered: number;
  amount_due: number;
  discount: number;
  amount_paid: number;
  payment_date: string | null;
  payment_mode: PaymentMode | null;
  receipt_url: string | null;
  receipt_number: string | null;
  notes: string | null;
  status: FeeStatus;
  created_at: string;
  student?: { id: string; name: string; parent_mobile: string };
}

export interface RecordFeeInput {
  student_id: string;
  month_from: number;
  year_from: number;
  month_to: number;
  year_to: number;
  amount_due: number;
  discount?: number;
  amount_paid: number;
  payment_mode?: PaymentMode;
  payment_date?: string;
  notes?: string;
}

export interface UpdateFeeInput {
  amount_paid?: number;
  discount?: number;
  payment_mode?: PaymentMode;
  payment_date?: string;
  notes?: string;
}
