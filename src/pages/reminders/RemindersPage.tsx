import { useState } from 'react';
import { MessageCircle, CheckCircle2 } from 'lucide-react';
import { useThisMonth } from '@/hooks/useDashboard';
import { useGenerateReminder } from '@/hooks/useReminders';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatMoney, monthName } from '@/lib/utils';
import type { ThisMonthStudent } from '@/types/dashboard';

export function RemindersPage() {
  const { data: thisMonth, isLoading } = useThisMonth();
  const generateReminder = useGenerateReminder();
  const [sending, setSending] = useState<string | null>(null);

  const pending = (thisMonth?.students ?? []).filter(
    (s) => (s.status === 'PENDING' || s.status === 'PARTIAL') && s.fee_record_id,
  );

  const handleSend = async (s: ThisMonthStudent) => {
    if (!s.fee_record_id || sending) return;
    setSending(s.student_id);
    try {
      const result = await generateReminder.mutateAsync({
        student_id: s.student_id,
        fee_record_id: s.fee_record_id,
      });
      window.open(result.whatsapp_link, '_blank');
    } finally {
      setSending(null);
    }
  };

  const month = thisMonth?.month;
  const year = thisMonth?.year;

  return (
    <div>
      <PageHeader title="Reminders" />

      <div className="px-4 py-4 space-y-3">

        {/* Month heading */}
        {month && year && (
          <p className="text-sm text-surface-600 font-medium">
            {monthName(month)} {year}
          </p>
        )}

        {isLoading ? (
          <Spinner />
        ) : pending.length === 0 ? (
          /* All paid / no pending */
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-paid-light flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-paid" />
            </div>
            <p className="text-base font-bold text-surface-900">All clear!</p>
            <p className="text-sm text-surface-600 text-center">
              No pending fees this month.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-surface-500">
              Tap "Remind" to open WhatsApp with a pre-filled message for that student's parent.
            </p>

            {pending.map((s) => {
              const balance =
                Number(s.amount_due) - Number(s.discount) - Number(s.amount_paid);
              const isSending = sending === s.student_id;

              return (
                <div
                  key={s.student_id}
                  className="bg-white rounded-2xl border border-surface-200 px-4 py-3 flex items-center gap-3 min-h-tap"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-pending-light flex items-center justify-center text-base font-bold text-pending-dark shrink-0">
                    {s.student_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-surface-900 truncate">
                      {s.student_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-pending">
                        {formatMoney(balance)} due
                      </span>
                      {s.batch_name && (
                        <span className="text-xs text-surface-400">· {s.batch_name}</span>
                      )}
                    </div>
                  </div>

                  {/* Send button */}
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleSend(s)}
                    loading={isSending}
                    disabled={!!sending && !isSending}
                  >
                    {!isSending && <MessageCircle className="h-4 w-4" />}
                    Remind
                  </Button>
                </div>
              );
            })}

            <p className="text-xs text-surface-400 text-center pt-2">
              {pending.length} student{pending.length !== 1 ? 's' : ''} with pending fees
            </p>
          </>
        )}
      </div>
    </div>
  );
}
