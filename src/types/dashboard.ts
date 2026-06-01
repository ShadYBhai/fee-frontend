export interface RecentPayment {
  id: string;
  student_id: string;
  student_name: string;
  amount_paid: number;
  payment_mode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | null;
  payment_date: string | null;
  receipt_number: string | null;
}

export interface PendingStudent {
  fee_record_id: string;
  student_id: string;
  student_name: string;
  parent_mobile: string;
  amount_due: number;
  discount: number;
  amount_paid: number;
  status: 'PENDING' | 'PARTIAL';
}

export interface ThisMonthStudent {
  student_id: string;
  student_name: string;
  parent_mobile: string;
  batch_name: string | null;
  default_fee: number;
  fee_record_id: string | null;
  amount_due: number;
  discount: number;
  amount_paid: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
}

export interface ThisMonthData {
  month: number;
  year: number;
  students: ThisMonthStudent[];
}

export interface DashboardData {
  month: number;
  year: number;
  plan: 'TRIAL' | 'STARTER' | 'GROWTH';
  plan_expiry: string | null;
  total_students: number;
  total_collected: number;
  total_pending: number;
  collection_percentage: number;
  paid_count: number;
  partial_count: number;
  pending_count: number;
  last_5_payments: RecentPayment[];
  pending_students: PendingStudent[];
}
