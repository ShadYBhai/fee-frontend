import { cn } from '@/lib/utils';
import type { FeeStatus } from '@/types/fee';

const STATUS_STYLES: Record<FeeStatus, string> = {
  PAID:    'bg-paid-light text-paid-dark font-semibold',
  PARTIAL: 'bg-partial-light text-partial-dark font-semibold',
  PENDING: 'bg-pending-light text-pending-dark font-semibold',
};

const STATUS_LABELS: Record<FeeStatus, string> = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  PENDING: 'Pending',
};

interface BadgeProps {
  status: FeeStatus;
  className?: string;
}

export function FeeStatusBadge({ status, className }: BadgeProps) {
  return (
    <span className={cn('inline-block px-3 py-1 rounded-full text-sm', STATUS_STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: 'TRIAL' | 'STARTER' | 'GROWTH' }) {
  const styles = {
    TRIAL:   'bg-surface-100 text-surface-700',
    STARTER: 'bg-brand-100 text-brand-700',
    GROWTH:  'bg-purple-100 text-purple-700',
  };
  return (
    <span className={cn('inline-block px-3 py-1 rounded-full text-sm font-semibold', styles[plan])}>
      {plan}
    </span>
  );
}
