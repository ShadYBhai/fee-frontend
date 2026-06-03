import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Square, Users, Minus, Plus, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useStudents } from '@/hooks/useStudents';
import { useRecordBulkFees } from '@/hooks/useFees';
import { formatMoney, getCurrentMonth, getCurrentYear, monthName } from '@/lib/utils';
import type { PaymentMode, BulkRecordResult } from '@/types/fee';

type Step = 'select' | 'pay' | 'done';

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

const TODAY = new Date().toISOString().slice(0, 10);

/** Add N months to a given month/year, returns { month, year } */
function addMonths(month: number, year: number, n: number) {
  const total = month - 1 + n;
  return { month: (total % 12) + 1, year: year + Math.floor(total / 12) };
}

export function BulkRecordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('select');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [monthFrom] = useState(getCurrentMonth());
  const [yearFrom] = useState(getCurrentYear());
  const [monthsCount, setMonthsCount] = useState(1);
  const [discount, setDiscount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [paymentDate, setPaymentDate] = useState(TODAY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BulkRecordResult | null>(null);

  const { data: studentsData, isLoading } = useStudents({ status: 'ACTIVE' });
  const bulkRecord = useRecordBulkFees();

  const students = studentsData?.data ?? [];
  const filtered = students.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.parent_mobile.includes(search),
  );

  const discountNum = parseFloat(discount) || 0;
  const selectedStudents = students.filter((s) => selected.has(s.id));
  const totalFees = selectedStudents.reduce((sum, s) => sum + Number(s.default_fee) * monthsCount, 0);
  const totalDiscount = discountNum * selected.size;
  const totalCollected = Math.max(0, totalFees - totalDiscount);

  // Compute month_to / year_to from monthFrom + monthsCount
  const { month: monthTo, year: yearTo } = addMonths(monthFrom, yearFrom, monthsCount - 1);

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrors({});

    const result = await bulkRecord.mutateAsync({
      student_ids: [...selected],
      month_from: monthFrom,
      year_from: yearFrom,
      month_to: monthTo,
      year_to: yearTo,
      discount: discountNum || undefined,
      payment_mode: paymentMode,
      payment_date: paymentDate,
    });

    if (result) {
      setResult(result);
      setStep('done');
    }
  };

  // ── Step 3: Done / result screen ─────────────────────────────────────────────
  if (step === 'done' && result) {
    return (
      <div>
        <PageHeader title="Bulk Payment" />
        <div className="px-4 py-6 space-y-4">
          {/* Recorded */}
          {result.count > 0 && (
            <div className="bg-paid-light rounded-2xl border border-paid/20 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-paid shrink-0" />
                <p className="text-base font-bold text-paid-dark">
                  {result.count} payment{result.count !== 1 ? 's' : ''} recorded
                </p>
              </div>
              {result.records.map((r) => (
                <div key={r.fee_id} className="flex justify-between text-sm text-paid-dark/80 pl-7">
                  <span>{r.student_name}</span>
                  <span className="font-semibold">PAID</span>
                </div>
              ))}
            </div>
          )}

          {/* Skipped */}
          {result.skipped.length > 0 && (
            <div className="bg-surface-50 rounded-2xl border border-surface-200 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-surface-400 shrink-0" />
                <p className="text-base font-semibold text-surface-700">
                  {result.skipped.length} skipped
                </p>
              </div>
              {result.skipped.map((r) => (
                <div key={r.student_id} className="flex justify-between text-sm pl-7">
                  <span className="text-surface-700">{r.student_name}</span>
                  <span className="text-surface-400">{r.reason}</span>
                </div>
              ))}
              <p className="text-xs text-surface-400 pl-7 pt-1">
                Use individual recording for these students.
              </p>
            </div>
          )}

          <Button size="full" onClick={() => navigate('/')}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 1: Select students ──────────────────────────────────────────────────
  if (step === 'select') {
    const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));
    return (
      <div className="pb-28">
        <PageHeader title="Bulk Payment" back />

        {/* Info note */}
        <div className="mx-4 mt-4 bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3 flex gap-2">
          <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
          <p className="text-xs text-brand-700">
            Bulk records <strong>full payment</strong> at each student's default fee. For partial payments or custom amounts, record individually.
          </p>
        </div>

        <div className="px-4 py-4 space-y-3">
          <input
            type="search"
            placeholder="Search name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-tap rounded-xl border border-surface-200 bg-white px-4 text-base text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {filtered.length > 0 && (
            <button
              onClick={toggleAll}
              className="w-full bg-white rounded-2xl border border-surface-200 px-4 py-3 flex items-center gap-3 min-h-tap active:bg-surface-50"
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${allFilteredSelected ? 'bg-brand-500 border-brand-500' : 'border-surface-300'}`}>
                {allFilteredSelected && <CheckSquare className="w-4 h-4 text-white" />}
              </div>
              <span className="text-base font-semibold text-surface-900">
                {allFilteredSelected ? 'Deselect All' : `Select All (${filtered.length})`}
              </span>
            </button>
          )}

          {isLoading ? <Spinner /> : (
            <div className="space-y-2">
              {filtered.map((s) => {
                const isSelected = selected.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStudent(s.id)}
                    className={`w-full rounded-2xl border px-4 py-3 flex items-center gap-3 min-h-tap transition-colors text-left ${
                      isSelected ? 'bg-brand-50 border-brand-300' : 'bg-white border-surface-200 active:bg-surface-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-surface-300'}`}>
                      {isSelected ? <CheckSquare className="w-4 h-4 text-white" /> : <Square className="w-4 h-4 text-surface-300" />}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-base font-bold text-brand-600 shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-surface-900">{s.name}</p>
                      <p className="text-sm text-surface-500">
                        {s.batch?.name ?? 'No batch'} · {formatMoney(Number(s.default_fee))}/mo
                      </p>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center text-surface-500 py-8">No active students found</p>
              )}
            </div>
          )}
        </div>

        {selected.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-surface-200 px-4 py-3 flex items-center justify-between safe-bottom">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" />
              <span className="text-base font-bold text-surface-900">{selected.size} selected</span>
            </div>
            <Button onClick={() => setStep('pay')}>
              Continue →
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Step 2: Payment details ───────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Bulk Payment" back onBack={() => setStep('select')} />

      {/* Selected students bar */}
      <div className="px-4 py-2.5 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-900">{selected.size} students selected</p>
          <p className="text-xs text-brand-600">Each pays their own default fee in full</p>
        </div>
        <button onClick={() => setStep('select')} className="text-sm text-brand-500 font-semibold">
          Edit
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">

        {/* Months covered stepper */}
        <div>
          <p className="text-sm font-semibold text-surface-900 mb-2">Months Covered</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMonthsCount((n) => Math.max(1, n - 1))}
              className="w-11 h-11 rounded-xl border border-surface-200 bg-white flex items-center justify-center active:bg-surface-50"
            >
              <Minus className="w-5 h-5 text-surface-700" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-black text-surface-900">{monthsCount}</span>
              <p className="text-xs text-surface-500 mt-0.5">
                {monthName(monthFrom)} {yearFrom}
                {monthsCount > 1 ? ` – ${monthName(monthTo)} ${yearTo}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMonthsCount((n) => Math.min(12, n + 1))}
              className="w-11 h-11 rounded-xl border border-surface-200 bg-white flex items-center justify-center active:bg-surface-50"
            >
              <Plus className="w-5 h-5 text-surface-700" />
            </button>
          </div>
          {errors.period && <p className="text-sm text-pending mt-1">{errors.period}</p>}
        </div>

        {/* Discount */}
        <Input
          label="Discount per student (₹)"
          type="number"
          inputMode="numeric"
          prefix="₹"
          placeholder="0  (optional)"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          hint="Same discount applied to every selected student"
        />

        {/* Payment mode */}
        <div>
          <label className="block text-sm font-semibold text-surface-900 mb-2">Payment Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setPaymentMode(mode.value)}
                className={`min-h-tap rounded-xl border text-sm font-semibold transition-colors ${
                  paymentMode === mode.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-surface-200 bg-white text-surface-700'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Payment Date"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
        />

        {/* Summary — spec style */}
        <div className="bg-paid-light rounded-2xl border border-paid/20 px-4 py-3 space-y-1.5 text-sm">
          <div className="flex items-center gap-1.5 text-paid-dark font-semibold mb-1">
            <span>→</span>
            <span>Marks all {selected.size} as PAID</span>
          </div>
          <div className="flex items-center gap-1.5 text-paid-dark">
            <span>→</span>
            <span>Each at their own default fee × {monthsCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-paid-dark">
            <span>→</span>
            <span>Generates {selected.size} receipt{selected.size !== 1 ? 's' : ''}</span>
          </div>
          {discountNum > 0 && (
            <div className="flex items-center gap-1.5 text-paid-dark">
              <span>→</span>
              <span>−{formatMoney(discountNum)} discount each · total {formatMoney(totalDiscount)} off</span>
            </div>
          )}

          {/* Per-student fee breakdown */}
          <div className="border-t border-paid/20 pt-2 mt-1 space-y-1">
            {selectedStudents.map((s) => {
              const fee = Number(s.default_fee) * monthsCount;
              const net = Math.max(0, fee - discountNum);
              return (
                <div key={s.id} className="flex justify-between text-xs text-paid-dark/80">
                  <span className="truncate max-w-[55%]">{s.name}</span>
                  <span className="font-semibold tabular-nums">
                    {discountNum > 0 ? (
                      <><span className="line-through opacity-50 mr-1">{formatMoney(fee)}</span>{formatMoney(net)}</>
                    ) : formatMoney(fee)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-paid/20 pt-2 flex justify-between">
            <span className="font-semibold text-surface-700">Total collected</span>
            <span className="font-black text-paid">{formatMoney(totalCollected)}</span>
          </div>
        </div>

        {/* Soft info note */}
        <p className="text-xs text-surface-400 text-center leading-relaxed">
          Bulk payment records full fee for selected students.<br />
          Partial · custom amount · different months → record individually
        </p>

        <Button type="submit" size="full" loading={bulkRecord.isPending}>
          Record {selected.size} Payment{selected.size !== 1 ? 's' : ''}
        </Button>
      </form>
    </div>
  );
}
