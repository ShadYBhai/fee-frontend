import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bell, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { useDashboard, useThisMonth } from '@/hooks/useDashboard';
import { useUpdateFee } from '@/hooks/useFees';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { formatMoney, monthName, getCurrentMonth, getCurrentYear, formatDate } from '@/lib/utils';
import type { ThisMonthStudent } from '@/types/dashboard';

const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: 'Cash', UPI: 'UPI', BANK_TRANSFER: 'Bank Transfer',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const owner = useAuthStore((s) => s.owner);
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [quickPay, setQuickPay] = useState<ThisMonthStudent | null>(null);
  const [payForm, setPayForm] = useState({ amount_paid: '', payment_mode: 'CASH' });

  const isCurrentMonth = month === getCurrentMonth() && year === getCurrentYear();
  const { data, isLoading } = useDashboard(month, year);
  const { data: thisMonth, isLoading: loadingThisMonth } = useThisMonth();
  const updateFee = useUpdateFee();

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const openQuickPay = (s: ThisMonthStudent) => {
    // No fee record yet → go to RecordFeePage to create one
    if (!s.fee_record_id) {
      navigate(`/fees/new?student_id=${s.student_id}`);
      return;
    }
    const net = s.amount_due - s.discount;
    const remaining = net - s.amount_paid;
    setPayForm({ amount_paid: String(remaining > 0 ? remaining : 0), payment_mode: 'CASH' });
    setQuickPay(s);
  };

  const handleFullPay = async (s: ThisMonthStudent) => {
    // No fee record yet → go to RecordFeePage to create one
    if (!s.fee_record_id) {
      navigate(`/fees/new?student_id=${s.student_id}`);
      return;
    }
    const net = s.amount_due - s.discount;
    const remaining = net - s.amount_paid;
    if (remaining <= 0) return;
    await updateFee.mutateAsync({
      id: s.fee_record_id,
      data: {
        amount_paid: s.amount_paid + remaining,
        payment_mode: 'CASH',
        payment_date: new Date().toISOString().slice(0, 10),
      },
    });
    qc.invalidateQueries({ queryKey: ['dashboard', 'this-month'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleQuickPay = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!quickPay?.fee_record_id) return;
    const payingNow = parseFloat(payForm.amount_paid) || 0;
    // ADD to whatever was already paid — teacher is recording an additional payment
    const newTotal = Number(quickPay.amount_paid) + payingNow;
    await updateFee.mutateAsync({
      id: quickPay.fee_record_id,
      data: {
        amount_paid: newTotal,
        payment_mode: payForm.payment_mode as 'CASH' | 'UPI' | 'BANK_TRANSFER',
        payment_date: new Date().toISOString().slice(0, 10),
      },
    });
    qc.invalidateQueries({ queryKey: ['dashboard', 'this-month'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    setQuickPay(null);
  };

  // Group this-month students by status
  const pending = thisMonth?.students.filter((s) => s.status === 'PENDING') ?? [];
  const partial = thisMonth?.students.filter((s) => s.status === 'PARTIAL') ?? [];
  const paid = thisMonth?.students.filter((s) => s.status === 'PAID') ?? [];

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-surface-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-surface-900">FeeFlow</h1>
          <p className="text-xs text-surface-700">{owner?.institute_name ?? 'Your Institute'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="min-h-tap min-w-tap flex items-center justify-center rounded-xl hover:bg-surface-100">
            <ChevronLeft className="h-5 w-5 text-surface-700" />
          </button>
          <span className="text-sm font-semibold text-surface-900 min-w-[100px] text-center">
            {monthName(month)} {year}
          </span>
          <button onClick={nextMonth} className="min-h-tap min-w-tap flex items-center justify-center rounded-xl hover:bg-surface-100">
            <ChevronRight className="h-5 w-5 text-surface-700" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {isLoading ? <Spinner /> : data ? (
          <>
            {/* Summary tiles */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-paid-light border-paid/30 p-4">
                <p className="text-2xl font-black text-paid-dark">{formatMoney(data.total_collected)}</p>
                <p className="text-sm text-paid font-semibold mt-1">Collected</p>
              </Card>
              <Card className="bg-pending-light border-pending/30 p-4">
                <p className="text-2xl font-black text-pending-dark">{formatMoney(data.total_pending)}</p>
                <p className="text-sm text-pending font-semibold mt-1">Pending</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-500" />
                  <span className="text-2xl font-black text-surface-900">{data.total_students}</span>
                </div>
                <p className="text-sm text-surface-700 mt-1">Total Students</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-500" />
                  <span className="text-2xl font-black text-surface-900">{data.collection_percentage}%</span>
                </div>
                <p className="text-sm text-surface-700 mt-1">Collected</p>
              </Card>
            </div>

            {/* Status counts */}
            <Card className="p-4">
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-2xl font-black text-paid">{data.paid_count}</p>
                  <p className="text-sm text-surface-700">Paid</p>
                </div>
                <div className="w-px bg-surface-200" />
                <div className="text-center">
                  <p className="text-2xl font-black text-partial">{data.partial_count}</p>
                  <p className="text-sm text-surface-700">Partial</p>
                </div>
                <div className="w-px bg-surface-200" />
                <div className="text-center">
                  <p className="text-2xl font-black text-pending">{data.pending_count}</p>
                  <p className="text-sm text-surface-700">Pending</p>
                </div>
              </div>
            </Card>
          </>
        ) : null}

        {/* This Month — only show for current month */}
        {isCurrentMonth && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-surface-900">This Month</h2>
              {(pending.length + partial.length) > 0 && (
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => navigate(`/reminders?month=${month}&year=${year}`)}
                >
                  <Bell className="h-4 w-4" />
                  Remind All
                </Button>
              )}
            </div>

            {loadingThisMonth ? <Spinner /> : (
              <div className="space-y-2">
                {/* Pending */}
                {pending.map((s) => (
                  <StudentRow key={s.student_id} student={s} onFullPay={() => handleFullPay(s)} onPartPay={() => openQuickPay(s)} onView={() => navigate(`/students/${s.student_id}`)} />
                ))}
                {partial.map((s) => (
                  <StudentRow key={s.student_id} student={s} onFullPay={() => handleFullPay(s)} onPartPay={() => openQuickPay(s)} onView={() => navigate(`/students/${s.student_id}`)} />
                ))}
                {/* Paid — collapsed count */}
                {paid.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-paid-light rounded-2xl border border-paid/20">
                    <CheckCircle2 className="h-5 w-5 text-paid shrink-0" />
                    <p className="text-sm font-semibold text-paid-dark">
                      {paid.length} student{paid.length !== 1 ? 's' : ''} paid ✓
                    </p>
                  </div>
                )}
                {thisMonth?.students.length === 0 && (
                  <p className="text-sm text-surface-500 text-center py-6">No active students yet.</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Recent payments — for past months */}
        {!isCurrentMonth && data?.last_5_payments && data.last_5_payments.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-surface-900 mb-3">Recent Payments</h2>
            <div className="space-y-2">
              {data.last_5_payments.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/fees/${p.id}`)}
                  className="w-full bg-white rounded-2xl border border-surface-200 px-4 py-3 flex items-center justify-between text-left min-h-tap active:bg-surface-50"
                >
                  <div>
                    <p className="text-base font-semibold text-surface-900">{p.student_name}</p>
                    <p className="text-sm text-surface-700">
                      {p.payment_mode ? PAYMENT_MODE_LABELS[p.payment_mode] : '—'} · {formatDate(p.payment_date)}
                    </p>
                  </div>
                  <p className="text-base font-bold text-paid">+{formatMoney(p.amount_paid)}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="primary" size="full" onClick={() => navigate('/fees/new')}>
            + Record Payment
          </Button>
          <Button variant="secondary" size="full" onClick={() => navigate('/fees/bulk')}>
            Bulk Payment
          </Button>
        </div>
      </div>

      {/* Quick Pay bottom sheet */}
      {quickPay && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setQuickPay(null)} />
          <form onSubmit={handleQuickPay} className="relative bg-white rounded-t-3xl px-4 pt-4 pb-8 space-y-4">
            <div className="w-10 h-1 bg-surface-300 rounded-full mx-auto mb-1" />

            <div>
              <p className="text-lg font-bold text-surface-900">{quickPay.student_name}</p>
              <p className="text-sm text-surface-700">
                Due: {formatMoney(quickPay.amount_due - quickPay.discount - quickPay.amount_paid)}
                {quickPay.batch_name ? ` · ${quickPay.batch_name}` : ''}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-900 mb-2">Paying Now (₹)</label>
              <input
                type="number"
                inputMode="numeric"
                value={payForm.amount_paid}
                onChange={(e) => setPayForm((f) => ({ ...f, amount_paid: e.target.value }))}
                className="w-full min-h-tap-lg rounded-xl border border-surface-200 bg-white px-4 text-2xl font-bold text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
              {quickPay.amount_paid > 0 && (
                <p className="text-xs text-surface-500 mt-1">
                  Already paid: {formatMoney(quickPay.amount_paid)} · will be added to total
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-900 mb-2">Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'UPI', 'BANK_TRANSFER'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPayForm((f) => ({ ...f, payment_mode: mode }))}
                    className={`min-h-tap rounded-xl border text-sm font-semibold transition-colors ${
                      payForm.payment_mode === mode
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-surface-200 bg-white text-surface-700'
                    }`}
                  >
                    {PAYMENT_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="full" loading={updateFee.isPending}>
              Mark Paid
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function StudentRow({
  student, onFullPay, onPartPay, onView,
}: {
  student: ThisMonthStudent;
  onFullPay: () => void;
  onPartPay: () => void;
  onView: () => void;
}) {
  const net = student.amount_due - student.discount;
  const balance = net - student.amount_paid;

  return (
    <div className="bg-white rounded-2xl border border-surface-200 px-3 py-3 flex items-center gap-2 min-h-tap">
      <button onClick={onView} className="flex-1 text-left min-w-0">
        <p className="text-base font-semibold text-surface-900 truncate">{student.student_name}</p>
        <p className="text-sm text-surface-700">
          {student.batch_name ?? 'No batch'} · {formatMoney(balance)} due
        </p>
      </button>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onFullPay}
          className="min-h-tap px-3 rounded-xl bg-paid text-white text-sm font-bold hover:bg-green-700 active:scale-95"
        >
          ✓ Full
        </button>
        <button
          onClick={onPartPay}
          className="min-h-tap px-3 rounded-xl border border-surface-300 bg-white text-surface-700 text-sm font-semibold hover:bg-surface-50 active:scale-95"
        >
          Part
        </button>
      </div>
    </div>
  );
}
