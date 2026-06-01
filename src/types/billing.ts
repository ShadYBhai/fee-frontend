export interface BillingStatus {
  plan: 'TRIAL' | 'STARTER' | 'GROWTH';
  plan_expiry: string | null;
  razorpay_sub_id: string | null;
  is_active: boolean;
  is_trial_expired: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  student_limit: number;
  description: string;
  duration_days?: number;
}

export interface SubscribeInput {
  plan: 'STARTER' | 'GROWTH';
  period: 'monthly' | 'yearly';
}
