import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, MessageCircle, Edit, CheckCircle2 } from 'lucide-react';
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
  // "payingNow" = incremental amount being paid this time
  const [payingNow, setPayingNow] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [editMode, setEditMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('CASH');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');
  const [reminderLoading, setReminderLoading] = useState(false);

  const openEdit = (prefillFull = false) => {
    if (!fee) return;
    const amountDue = Number(fee.amount_due);
    const disc = Number(fee.discount);
    const paid = Number(fee.amount_paid);
    const bal = amountDue - disc - paid;
    setPayingNow(prefillFull ? String(bal > 0 ? bal : 0) : '');
    setEditDiscount(String(disc));
    setEditMode((fee.payment_mode ?? 'CASH') as 'CASH' | 'UPI' | 'BANK_TRANSFER');
    setEditDate(fee.payment_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
    setEditNotes(fee.notes ?? '');
    setEditError('');
    setEditing(true);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!fee) return;

    const amountDue = Number(fee.amount_due);
    const disc = parseFloat(editDiscount) || 0;
    const existingPaid = Number(fee.amount_paid);
    const addingNow = parseFloat(payingNow) || 0;
    const newTotalPaid = existingPaid + addingNow;
    const netDue = amountDue - disc;

    if (addingNow < 0) { setEditError('Amount cannot be negative'); return; }
    if (newTotalPaid > netDue) { setEditError(`Total paid cannot exceed payable amount (${formatMoney(netDue)})`); return; }
    if (disc < 0 || disc > amountDue) { setEditError('Discount cannot exceed fee amount'); return; }

    setEditError('');
    await updateFee.mutateAsync({
      id: fee.id,
      data: {
        amount_paid: newTotalPaid,
        discount: disc,
        payment_mode: editMode,
        payment_date: editDate || undefined,
        notes: editNotes.trim() || undefined,
      },
    });
    setEditing(false);
    setPayingNow('');
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

  if (isLoading) return <div><PageHeader title="Fee Details" back /><div className="py-12"><Spinner /></div></div>;
  if (!fee) return <div><PageHeader title="Fee Details" back /><div className="px-4 py-12 text-center text-surface-700">Record not found.</div></div>;

  const amountDue = Number(fee.amount_due);
  const discount = Number(fee.discount);
  const amountPaid = Number(fee.amount_paid);
  const netDue = amountDue - discount;
  const balance = netDue - amountPaid;

  // Live preview in edit sheet
  const previewDiscount = parseFloat(editDiscount) || 0;
  const previewNetDue = amountDue - previewDiscount;
  const previewAdding = parseFloat(payingNow) || 0;
  const previewNewTotal = amountPaid + previewAdding;
  const previewBalance = previewNetDue - previewNewTotal;

  return (
    <div>
      <PageHeader
        title="Fee Details"
        back
        action={
          fee.status !== 'PAID' ? (
            <button
              onClick={() => openEdit(false)}
              className="min-h-tap min-w-tap flex items-center justify-center rounded-xl hover:bg-surface-100"
              aria-label="Edit"
            >
              <Edit className="h-5 w-5 text-surface-700" />
            </button>
          ) : undefined
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

        {/* Amount breakdown */}
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

          <div className="border-t border-surface-100 px-4 py-3 flex items-center justify-between bg-paid-light">
            <span className="text-sm font-semibold text-paid-dark">Paid</span>
            <span className="text-base font-black text-paid">{formatMoney(amountPaid)}</span>
          </div>

          {balance > 0 && (
            <div className="border-t border-surface-100 px-4 py-3 flex items-center justify-between bg-pending-light">
              <span className="text-sm font-semibold text-pending-dark">Balance Due</span>
              <span className="text-base font-black text-pending">{formatMoney(balance)}</span>
            </div>
          )}
        </div>

        {/* Payment info */}
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

          {/* Mark as Paid — quick button for partial/pending */}
          {fee.status !== 'PAID' && balance > 0 && (
            <Button
              variant="primary"
              size="full"
              onClick={() => openEdit(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark as Paid ({formatMoney(balance)} remaining)
            </Button>
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

      {/* Record payment bottom sheet */}
      {editing && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(false)} />
          <form
            onSubmit={handleSave}
            className="relative bg-white rounded-t-3xl px-4 pt-5 pb-8 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="w-10 h-1 bg-surface-300 rounded-full mx-auto mb-1" />
            <h3 className="text-lg font-bold text-surface-900">Record Payment</h3>

            {/* Existing balance info */}
            <div className="bg-surface-50 rounded-xl px-4 py-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-surface-600">Fee Charged</span>
                <span>{formatMoney(amountDue)}</span>
              </div>
              {previewDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-surface-600">Discount</span>
                  <span>− {formatMoney(previewDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-surface-600">Already Paid</span>
                <span className="text-paid font-semibold">{formatMoney(amountPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-surface-200 pt-1.5">
                <span className="font-semibold text-surface-900">Balance Due</span>
                <span className="font-bold text-pending">{formatMoney(Math.max(0, previewNetDue - amountPaid))}</span>
              </div>
            </div>

            {/* Paying now */}
            <Input
              label="Paying Now (₹)"
              type="number"
              inputMode="numeric"
              prefix="₹"
              placeholder={`Full balance: ${formatMoney(Math.max(0, previewNetDue - amountPaid))}`}
              value={payingNow}
              onChange={(e) => { setPayingNow(e.target.value); setEditError(''); }}
              autoFocus
            />

            {/* Live preview after payment */}
            {previewAdding > 0 && (
              <div className="bg-surface-50 rounded-xl px-4 py-3 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-surface-600">Paying Now</span>
                  <span className="text-paid font-semibold">{formatMoney(previewAdding)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600">New Total Paid</span>
                  <span className="font-semibold">{formatMoney(previewNewTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-surface-200 pt-1.5">
                  <span className="font-bold text-surface-900">Balance After</span>
                  <span className={`font-black ${previewBalance <= 0 ? 'text-paid' : 'text-pending'}`}>
                    {previewBalance <= 0 ? 'Fully Paid ✓' : formatMoney(previewBalance)}
                  </span>
                </div>
              </div>
            )}

            <Input
              label="Discount (₹)"
              type="number"
              inputMode="numeric"
              prefix="₹"
              placeholder="0"
              value={editDiscount}
              onChange={(e) => { setEditDiscount(e.target.value); setEditError(''); }}
            />

            <div>
              <label className="block text-sm font-semibold text-surface-900 mb-2">Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'UPI', 'BANK_TRANSFER'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEditMode(m)}
                    className={`min-h-tap rounded-xl border text-sm font-semibold transition-colors ${
                      editMode === m
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-surface-200 bg-white text-surface-700'
                    }`}
                  >
                    {m === 'BANK_TRANSFER' ? 'Bank' : m.charAt(0) + m.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Payment Date"
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />

            <Input
              label="Notes (optional)"
              placeholder="Any remarks..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />

            {editError && <p className="text-sm text-pending font-medium">{editError}</p>}

            <Button type="submit" size="full" loading={updateFee.isPending}>
              Save Payment
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
