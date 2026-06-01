import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useStudents, useStudent } from '@/hooks/useStudents';
import { useFees, useRecordFee, useUpdateFee } from '@/hooks/useFees';
import { formatMoney, getCurrentMonth, getCurrentYear, monthName, calcMonthsBetween } from '@/lib/utils';

type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER';

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

function yearOptions() {
  const curr = getCurrentYear();
  return [curr - 2, curr - 1, curr];
}

const MONTHS_LIST = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: monthName(i + 1) }));
const YEARS = yearOptions();
const TODAY = new Date().toISOString().slice(0, 10);

function blankForm() {
  return {
    month_from: getCurrentMonth(),
    year_from: getCurrentYear(),
    month_to: getCurrentMonth(),
    year_to: getCurrentYear(),
    amount_due: '',
    amount_due_touched: false,
    discount: '',
    payment_mode: 'CASH' as PaymentMode,
    payment_date: TODAY,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export function RecordFeePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetStudentId = params.get('student_id') ?? '';

  const [step, setStep] = useState<1 | 2>(presetStudentId ? 2 : 1);
  const [studentId, setStudentId] = useState(presetStudentId);
  const [studentSearch, setStudentSearch] = useState('');
  const [form, setForm] = useState(blankForm);

  // Amount inputs live outside `form` so they're clearly separate for each mode
  const [amountPaidInput, setAmountPaidInput] = useState('');  // create mode
  const [payingNowInput, setPayingNowInput] = useState('');    // update mode

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: studentsData, isLoading: loadingStudents } = useStudents({ status: 'ACTIVE' });
  const { data: selectedStudent } = useStudent(studentId);

  // After student + from-month is selected, check if a fee record already exists
  const { data: existingData, isLoading: checkingExisting } = useFees(
    studentId
      ? { student_id: studentId, month: form.month_from, year: form.year_from, limit: 1 }
      : undefined,
  );
  const existingFee = studentId ? (existingData?.data?.[0] ?? null) : null;

  const recordFee = useRecordFee();
  const updateFee = useUpdateFee();

  // ── Derived values for CREATE mode ────────────────────────────────────────
  const months = calcMonthsBetween(form.month_from, form.year_from, form.month_to, form.year_to);
  const defaultFee = Number(selectedStudent?.default_fee ?? 0);
  const effectiveAmountDue = form.amount_due_touched
    ? form.amount_due
    : defaultFee > 0 ? String(defaultFee * Math.max(months, 1)) : '';
  const amountDue = parseFloat(effectiveAmountDue) || 0;
  const discount = parseFloat(form.discount) || 0;
  const netDue = amountDue - discount;
  const amountPaid = parseFloat(amountPaidInput) || 0;
  const balanceCreate = netDue - amountPaid;

  // ── Derived values for UPDATE mode ────────────────────────────────────────
  const exDue = Number(existingFee?.amount_due ?? 0);
  const exDiscount = Number(existingFee?.discount ?? 0);
  const exPaid = Number(existingFee?.amount_paid ?? 0);
  const exBalance = exDue - exDiscount - exPaid;
  const payingNow = parseFloat(payingNowInput) || 0;
  const balanceAfter = exBalance - payingNow;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const selectStudent = (id: string) => {
    setStudentId(id);
    setStep(2);
    setForm(blankForm());
    setAmountPaidInput('');
    setPayingNowInput('');
    setErrors({});
  };

  // ── Submit: create new record ─────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (months < 1) errs.period = 'End month must be same as or after start month';
    if (amountDue <= 0) errs.amount_due = 'Enter the fee amount';
    if (discount < 0 || discount > amountDue) errs.discount = 'Discount cannot exceed fee amount';
    if (amountPaid < 0) errs.amount_paid = 'Invalid amount';
    if (amountPaid > netDue) errs.amount_paid = `Cannot exceed payable (${formatMoney(netDue)})`;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const result = await recordFee.mutateAsync({
      student_id: studentId,
      month_from: form.month_from,
      year_from: form.year_from,
      month_to: form.month_to,
      year_to: form.year_to,
      amount_due: amountDue,
      discount: discount || undefined,
      amount_paid: amountPaid,
      payment_mode: amountPaid > 0 ? form.payment_mode : undefined,
      payment_date: amountPaid > 0 ? form.payment_date : undefined,
    });
    navigate(`/fees/${result.id}`);
  };

  // ── Submit: update existing record ────────────────────────────────────────
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingFee) return;
    const errs: Record<string, string> = {};
    if (payingNow <= 0) errs.paying_now = 'Enter the amount being paid';
    if (payingNow > exBalance) errs.paying_now = `Cannot exceed balance due (${formatMoney(exBalance)})`;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    await updateFee.mutateAsync({
      id: existingFee.id,
      data: {
        amount_paid: exPaid + payingNow,   // ADD to existing total
        payment_mode: form.payment_mode,
        payment_date: form.payment_date,
      },
    });
    navigate(`/fees/${existingFee.id}`);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 1 — Student picker
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <div>
        <PageHeader title="Record Payment" back />
        <div className="px-4 py-4 space-y-3">
          <input
            type="search"
            placeholder="Search name or mobile..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="w-full min-h-tap rounded-xl border border-surface-200 bg-white px-4 text-base text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {loadingStudents ? <Spinner /> : (
            <div className="space-y-2">
              {studentsData?.data?.filter((s) =>
                !studentSearch ||
                s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                s.parent_mobile.includes(studentSearch),
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectStudent(s.id)}
                  className="w-full bg-white rounded-2xl border border-surface-200 px-4 py-3 flex items-center text-left min-h-tap active:bg-surface-50"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-base font-bold text-brand-600 mr-3 shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-surface-900">{s.name}</p>
                    <p className="text-sm text-surface-700">
                      {s.batch?.name ?? 'No batch'} · ₹{Number(s.default_fee).toLocaleString('en-IN')}/mo
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 2 header (shared)
  // ════════════════════════════════════════════════════════════════════════════
  const header = (
    <>
      <PageHeader title="Record Payment" back />
      <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-brand-900">{selectedStudent?.name ?? '...'}</p>
          <p className="text-sm text-brand-700">₹{defaultFee.toLocaleString('en-IN')}/mo</p>
        </div>
        {!presetStudentId && (
          <button onClick={() => { setStudentId(''); setStep(1); }} className="text-sm text-brand-500 font-semibold">
            Change
          </button>
        )}
      </div>
    </>
  );

  // Loading while checking DB
  if (checkingExisting && !existingData) {
    return (
      <div>
        {header}
        <div className="py-16 flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-surface-600">Checking records...</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MODE: ALREADY PAID — block duplicate, allow switching month
  // ════════════════════════════════════════════════════════════════════════════
  if (existingFee?.status === 'PAID') {
    return (
      <div>
        {header}
        <div className="px-4 py-4 space-y-4">

          <div className="bg-paid-light rounded-2xl border border-paid/20 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-paid shrink-0 mt-0.5" />
            <div>
              <p className="text-base font-bold text-paid-dark">Already fully paid</p>
              <p className="text-sm text-paid-dark/80">
                {monthName(existingFee.month_from)} {existingFee.year_from}
                {' · '}{formatMoney(Number(existingFee.amount_paid))} paid
              </p>
            </div>
          </div>

          <Button size="full" onClick={() => navigate(`/fees/${existingFee.id}`)}>
            View Payment Record
          </Button>

          <div className="border-t border-surface-100 pt-4">
            <p className="text-sm font-semibold text-surface-900 mb-2">Recording for a different month?</p>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.month_from}
                onChange={(e) => setForm((f) => ({ ...f, month_from: Number(e.target.value), month_to: Number(e.target.value) }))}
                className="w-full min-h-tap rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {MONTHS_LIST.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select
                value={form.year_from}
                onChange={(e) => setForm((f) => ({ ...f, year_from: Number(e.target.value), year_to: Number(e.target.value) }))}
                className="w-full min-h-tap rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MODE: UPDATE EXISTING — student has a PENDING/PARTIAL record this month
  // ════════════════════════════════════════════════════════════════════════════
  if (existingFee) {
    return (
      <div>
        {header}
        <form onSubmit={handleUpdate} className="px-4 py-4 space-y-4">

          {/* Existing record breakdown */}
          <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
              <p className="text-sm font-semibold text-surface-700">
                {monthName(existingFee.month_from)} {existingFee.year_from}
                {(existingFee.month_from !== existingFee.month_to || existingFee.year_from !== existingFee.year_to)
                  ? ` – ${monthName(existingFee.month_to)} ${existingFee.year_to}`
                  : ''}
              </p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                existingFee.status === 'PARTIAL'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-pending-light text-pending'
              }`}>
                {existingFee.status === 'PARTIAL' ? 'Partially Paid' : 'Not Paid Yet'}
              </span>
            </div>
            <div className="px-4 py-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-600">Fee Charged</span>
                <span>{formatMoney(exDue)}</span>
              </div>
              {exDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-surface-600">Discount</span>
                  <span>− {formatMoney(exDiscount)}</span>
                </div>
              )}
              {exPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-surface-600">Already Paid</span>
                  <span className="text-paid font-semibold">{formatMoney(exPaid)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-surface-100">
                <span className="font-bold text-surface-900">Balance Due</span>
                <span className="font-black text-lg text-pending">{formatMoney(exBalance)}</span>
              </div>
            </div>
          </div>

          {/* Amount paying now */}
          <div>
            <Input
              label="Paying Now (₹)"
              type="number"
              inputMode="numeric"
              prefix="₹"
              placeholder={`Full balance: ${formatMoney(exBalance)}`}
              value={payingNowInput}
              onChange={(e) => setPayingNowInput(e.target.value)}
              error={errors.paying_now}
              autoFocus
            />
          </div>

          {/* Live preview */}
          {payingNow > 0 && (
            <div className="bg-surface-50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-600">Paying Now</span>
                <span className="text-paid font-semibold">{formatMoney(payingNow)}</span>
              </div>
              <div className="flex justify-between border-t border-surface-200 pt-1.5">
                <span className="font-semibold text-surface-900">Balance Remaining</span>
                <span className={`font-bold ${balanceAfter > 0 ? 'text-pending' : 'text-paid'}`}>
                  {balanceAfter > 0 ? formatMoney(balanceAfter) : 'Fully Paid ✓'}
                </span>
              </div>
            </div>
          )}

          {/* Payment mode */}
          <div>
            <label className="block text-sm font-semibold text-surface-900 mb-2">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, payment_mode: mode.value }))}
                  className={`min-h-tap rounded-xl border text-sm font-semibold transition-colors ${
                    form.payment_mode === mode.value
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
            value={form.payment_date}
            onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
          />

          <Button type="submit" size="full" loading={updateFee.isPending}>
            Save Payment
          </Button>
        </form>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MODE: CREATE — no record for this period yet
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {header}
      <form onSubmit={handleCreate} className="px-4 py-4 space-y-5">

        {/* Period */}
        <div>
          <p className="text-sm font-semibold text-surface-900 mb-2">Fee Period</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-surface-500 mb-1 block">From Month</label>
              <select
                value={form.month_from}
                onChange={(e) => setForm((f) => ({ ...f, month_from: Number(e.target.value) }))}
                className="w-full min-h-tap rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {MONTHS_LIST.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-surface-500 mb-1 block">From Year</label>
              <select
                value={form.year_from}
                onChange={(e) => setForm((f) => ({ ...f, year_from: Number(e.target.value) }))}
                className="w-full min-h-tap rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-surface-500 mb-1 block">To Month</label>
              <select
                value={form.month_to}
                onChange={(e) => setForm((f) => ({ ...f, month_to: Number(e.target.value) }))}
                className="w-full min-h-tap rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {MONTHS_LIST.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-surface-500 mb-1 block">To Year</label>
              <select
                value={form.year_to}
                onChange={(e) => setForm((f) => ({ ...f, year_to: Number(e.target.value) }))}
                className="w-full min-h-tap rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {errors.period && <p className="text-sm text-pending mt-1">{errors.period}</p>}
          {months > 1 && defaultFee > 0 && (
            <p className="text-xs text-surface-500 mt-1">
              {months} months · ₹{defaultFee.toLocaleString('en-IN')} × {months} = ₹{(defaultFee * months).toLocaleString('en-IN')} auto-filled
            </p>
          )}
        </div>

        {/* Fee amount — auto-filled default_fee × months */}
        <div>
          <Input
            label="Fee Amount (₹)"
            type="number"
            inputMode="numeric"
            prefix="₹"
            placeholder="e.g. 1500"
            value={effectiveAmountDue}
            onChange={(e) => setForm((f) => ({ ...f, amount_due: e.target.value, amount_due_touched: true }))}
            error={errors.amount_due}
          />
        </div>

        <Input
          label="Discount (₹)"
          type="number"
          inputMode="numeric"
          prefix="₹"
          placeholder="0  (optional)"
          value={form.discount}
          onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
          error={errors.discount}
        />

        <div>
          <Input
            label="Amount Paid Today (₹)"
            type="number"
            inputMode="numeric"
            prefix="₹"
            placeholder={netDue > 0 ? `Full: ${formatMoney(netDue)}` : '0'}
            value={amountPaidInput}
            onChange={(e) => setAmountPaidInput(e.target.value)}
            error={errors.amount_paid}
          />
          {netDue > 0 && amountPaid === 0 && (
            <p className="text-xs text-surface-500 mt-1">Leave 0 to save as Pending</p>
          )}
        </div>

        {/* Summary */}
        {amountDue > 0 && (
          <div className="bg-surface-50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-surface-600">Fee Amount</span>
              <span>{formatMoney(amountDue)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-surface-600">Discount</span>
                <span>− {formatMoney(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-surface-200 pt-1">
              <span className="font-semibold text-surface-900">Net Payable</span>
              <span className="font-bold">{formatMoney(netDue)}</span>
            </div>
            {amountPaid > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-surface-600">Paid Today</span>
                  <span className="text-paid font-semibold">{formatMoney(amountPaid)}</span>
                </div>
                <div className="flex justify-between border-t border-surface-200 pt-1">
                  <span className="font-semibold text-surface-900">Balance Left</span>
                  <span className={`font-bold ${balanceCreate > 0 ? 'text-pending' : 'text-paid'}`}>
                    {balanceCreate > 0 ? formatMoney(balanceCreate) : 'Fully Paid ✓'}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Payment mode + date — only when paid */}
        {amountPaid > 0 && (
          <>
            <div>
              <label className="block text-sm font-semibold text-surface-900 mb-2">Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, payment_mode: mode.value }))}
                    className={`min-h-tap rounded-xl border text-sm font-semibold transition-colors ${
                      form.payment_mode === mode.value
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
              value={form.payment_date}
              onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
            />
          </>
        )}

        <Button type="submit" size="full" loading={recordFee.isPending}>
          Save Payment
        </Button>
      </form>
    </div>
  );
}
