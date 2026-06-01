import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, MessageCircle, Edit } from 'lucide-react';
import { useFeeRecord, useUpdateFee } from '@/hooks/useFees';
import { useGenerateReminder } from '@/hooks/useReminders';
import { PageHeader } from '@/components/ui/PageHeader';
import { FeeStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { formatMoney, formatPeriod, formatDate } from '@/lib/utils';
import { getReceiptUrl } from '@/api/fees.api';

const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: 'Cash', UPI: 'UPI', BANK_TRANSFER: 'Bank Transfer',
};

export function FeeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: fee, isLoading } = useFeeRecord(id!);
  const updateFee = useUpdateFee();
  const generateReminder = useGenerateReminder();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    amount_paid: '',
    discount: '',
    payment_mode: 'CASH',
    payment_date: '',
    notes: '',
  });
  const [reminderLoading, setReminderLoading] = useState(false);

  const handleEditOpen = () => {
    if (!fee) return;
    setEditForm({
      amount_paid: String(Number(fee.amount_paid)),
      discount: String(Number(fee.discount)),
      payment_mode: fee.payment_mode ?? 'CASH',
      payment_date: fee.payment_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      notes: fee.notes ?? '',
    });
    setEditing(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fee) return;
    await updateFee.mutateAsync({
      id: fee.id,
      data: {
        amount_paid: parseFloat(editForm.amount_paid) || 0,
        discount: parseFloat(editForm.discount) || 0,
        payment_mode: editForm.payment_mode as 'CASH' | 'UPI' | 'BANK_TRANSFER',
        payment_date: editForm.payment_date || undefined,
        notes: editForm.notes.trim() || undefined,
      },
    });
    setEditing(false);
  };

  const handleReminder = async () => {
    if (!fee) return;
    setReminderLoading(true);
    try {
      const result = await generateReminder.mutateAsync({
        student_id: fee.student_id,
        fee_record_id: fee.id,
      });
      window.open(result.whatsapp_link, '_blank');
    } finally {
      setReminderLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Fee Details" back />
        <div className="py-12"><Spinner /></div>
      </div>
    );
  }

  if (!fee) {
    return (
      <div>
        <PageHeader title="Fee Details" back />
        <div className="px-4 py-12 text-center text-surface-700">Record not found.</div>
      </div>
    );
  }

  const amountDue = Number(fee.amount_due);
  const discount = Number(fee.discount);
  const amountPaid = Number(fee.amount_paid);
  const netDue = amountDue - discount;
  const balance = netDue - amountPaid;

  return (
    <div>
      <PageHeader
        title="Fee Details"
        back
        action={
          <button
            onClick={handleEditOpen}
            className="min-h-tap min-w-tap flex items-center justify-center rounded-xl hover:bg-surface-100"
            aria-label="Edit"
          >
            <Edit className="h-5 w-5 text-surface-700" />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-3">

        {/* Student + period + status */}
        <div className="bg-white rounded-2xl border border-surface-200 px-4 py-3 flex items-start justify-between gap-2">
          <div>
            <button
              onClick={() => navigate(`/students/${fee.student_id}`)}
              className="text-base font-bold text-brand-600"
            >
              {fee.student?.name ?? 'Student'}
            </button>
            <p className="text-sm text-surface-600 mt-0.5">
              {formatPeriod(fee.month_from, fee.year_from, fee.month_to, fee.year_to)}
            </p>
          </div>
          <FeeStatusBadge status={fee.status} />
        </div>

        {/* Amount breakdown — receipt style */}
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
          <div className="px-4 py-3 space-y-2.5 text-sm">
            <AmountRow label="Fee Charged" value={formatMoney(amountDue)} />
            {discount > 0 && (
              <AmountRow label="Discount" value={`− ${formatMoney(discount)}`} valueClass="text-partial" />
            )}
            <div className="border-t border-surface-100 pt-2.5">
              <AmountRow label="Total Payable" value={formatMoney(netDue)} bold />
            </div>
          </div>

          {/* Paid strip */}
          <div className="border-t border-surface-100 px-4 py-3 flex items-center justify-between bg-paid-light">
            <span className="text-sm font-semibold text-paid-dark">Paid</span>
            <span className="text-base font-black text-paid">{formatMoney(amountPaid)}</span>
          </div>

          {/* Balance strip — only if something is still owed */}
          {balance > 0 && (
            <div className="border-t border-surface-100 px-4 py-3 flex items-center justify-between bg-pending-light">
              <span className="text-sm font-semibold text-pending-dark">Balance Due</span>
              <span className="text-base font-black text-pending">{formatMoney(balance)}</span>
            </div>
          )}
        </div>

        {/* Payment info — only when something was paid */}
        {amountPaid > 0 && (
          <div className="bg-white rounded-2xl border border-surface-200 px-4 py-3 space-y-2 text-sm">
            {fee.payment_mode && (
              <AmountRow label="Paid via" value={PAYMENT_MODE_LABELS[fee.payment_mode] ?? fee.payment_mode} />
            )}
            {fee.payment_date && (
              <AmountRow label="Payment Date" value={formatDate(fee.payment_date)} />
            )}
            {fee.receipt_number && (
              <AmountRow label="Receipt #" value={fee.receipt_number} />
            )}
            {fee.notes && (
              <div className="pt-1 border-t border-surface-100">
                <p className="text-xs text-surface-500 mb-0.5">Notes</p>
                <p className="text-surface-900">{fee.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {fee.receipt_url && (
            <a
              href={getReceiptUrl(fee.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-tap-lg rounded-2xl border border-brand-400 text-brand-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-50"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </a>
          )}

          {fee.status !== 'PAID' && (
            <Button
              variant="warning"
              size="full"
              onClick={handleReminder}
              loading={reminderLoading}
            >
              <MessageCircle className="h-4 w-4" />
              Send WhatsApp Reminder
            </Button>
          )}
        </div>
      </div>

      {/* Edit bottom sheet */}
      {editing && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(false)} />
          <form
            onSubmit={handleEditSave}
            className="relative bg-white rounded-t-3xl px-4 pt-5 pb-8 space-y-4"
          >
            <div className="w-10 h-1 bg-surface-300 rounded-full mx-auto mb-1" />
            <h3 className="text-lg font-bold text-surface-900">Edit Record</h3>

            <Input
              label="Total Paid So Far (₹)"
              type="number"
              inputMode="numeric"
              prefix="₹"
              value={editForm.amount_paid}
              onChange={(e) => setEditForm((f) => ({ ...f, amount_paid: e.target.value }))}
            />
            <p className="text-xs text-surface-500 -mt-3">
              Enter the correct running total, not just today's payment.
            </p>

            <Input
              label="Discount (₹)"
              type="number"
              inputMode="numeric"
              prefix="₹"
              placeholder="0"
              value={editForm.discount}
              onChange={(e) => setEditForm((f) => ({ ...f, discount: e.target.value }))}
            />

            <div>
              <label className="block text-sm font-semibold text-surface-900 mb-2">Payment Mode</label>
              <select
                value={editForm.payment_mode}
                onChange={(e) => setEditForm((f) => ({ ...f, payment_mode: e.target.value }))}
                className="w-full min-h-tap rounded-xl border border-surface-200 bg-white px-4 text-base text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>

            <Input
              label="Payment Date"
              type="date"
              value={editForm.payment_date}
              onChange={(e) => setEditForm((f) => ({ ...f, payment_date: e.target.value }))}
            />

            <Input
              label="Notes (optional)"
              placeholder="Any remarks..."
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
            />

            <Button type="submit" size="full" loading={updateFee.isPending}>
              Save Changes
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function AmountRow({
  label, value, bold, valueClass,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-surface-600">{label}</span>
      <span className={`${bold ? 'font-bold text-surface-900' : 'text-surface-900'} ${valueClass ?? ''}`}>
        {value}
      </span>
    </div>
  );
}
