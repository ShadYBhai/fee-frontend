import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, CheckCircle2, Copy, Download, Send } from 'lucide-react';
import { useThisMonth } from '@/hooks/useDashboard';
import { useGenerateReminder, useMonthlySummary, getExportCsvUrl } from '@/hooks/useReminders';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatMoney, monthName, buildWhatsAppLink } from '@/lib/utils';
import type { ThisMonthStudent } from '@/types/dashboard';
import type { MonthlySummaryStudent } from '@/types/reminder';

// ── Magic-link view ───────────────────────────────────────────────────────────

function MagicRemindersView({ token }: { token: string }) {
  const { data: summary, isLoading, isError } = useMonthlySummary(token);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-20">
        <Spinner />
        <p className="text-sm text-surface-500 mt-3">Loading your summary…</p>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="px-4 py-16 text-center space-y-2">
        <p className="text-base font-bold text-surface-900">Link expired or invalid</p>
        <p className="text-sm text-surface-500">
          Magic links are valid for 7 days. Ask FeeFlow to send a new one.
        </p>
      </div>
    );
  }

  const allNumbers = summary.students.map((s) => s.parent_mobile).join(', ');

  const broadcastMessage =
    `*Fee Reminder — ${summary.month_name} ${summary.year}*\n\n` +
    `Dear Parent, fees for ${summary.month_name} ${summary.year} are due. ` +
    `Please contact ${summary.institute_name} to clear your dues.\n\nThank you 🙏`;

  const handleCopyNumbers = async () => {
    await navigator.clipboard.writeText(allNumbers);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(broadcastMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleSend = (s: MonthlySummaryStudent) => {
    window.open(s.whatsapp_link, '_blank');
    setSent((prev) => new Set(prev).add(s.student_id));
  };

  return (
    <div>
      {/* Header — no back nav, this is a public page */}
      <div className="px-4 pt-5 pb-3 border-b border-surface-100">
        <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">FeeFlow</p>
        <h1 className="text-xl font-black text-surface-900 mt-0.5">{summary.institute_name}</h1>
        <p className="text-sm text-surface-600 mt-0.5">
          {summary.month_name} {summary.year} · Pending Fees
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Summary card */}
        <div className="bg-pending-light rounded-2xl px-4 py-3 flex justify-between items-center">
          <div>
            <p className="text-xs text-pending-dark font-semibold uppercase tracking-wide">Total Pending</p>
            <p className="text-2xl font-black text-pending mt-0.5">{formatMoney(summary.total_pending)}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-pending-dark">{summary.pending_count}</p>
            <p className="text-xs text-pending-dark">student{summary.pending_count !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Bulk actions */}
        {summary.students.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={handleCopyNumbers}
              className="w-full min-h-tap rounded-2xl border border-surface-200 bg-white text-sm font-semibold text-surface-700 flex items-center justify-center gap-2 hover:bg-surface-50"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy All Parent Numbers'}
            </button>

            <button
              onClick={handleCopyMessage}
              className="w-full min-h-tap rounded-2xl border border-surface-200 bg-white text-sm font-semibold text-surface-700 flex items-center justify-center gap-2 hover:bg-surface-50"
            >
              <MessageCircle className="h-4 w-4" />
              {copiedMsg ? 'Copied!' : 'Copy Broadcast Message'}
            </button>

            <a
              href={getExportCsvUrl(token)}
              download
              className="w-full min-h-tap rounded-2xl border border-surface-200 bg-white text-sm font-semibold text-surface-700 flex items-center justify-center gap-2 hover:bg-surface-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </div>
        )}

        {/* Broadcast instructions */}
        {summary.students.length > 0 && (
          <div className="bg-white rounded-2xl border border-surface-200 px-4 py-3 text-sm text-surface-600 space-y-1">
            <p className="font-semibold text-surface-900">How to send broadcast on WhatsApp:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Tap "Copy All Parent Numbers" above</li>
              <li>Open WhatsApp → New Broadcast → paste numbers</li>
              <li>Tap "Copy Broadcast Message" → paste and send</li>
            </ol>
          </div>
        )}

        {/* Per-student list */}
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">
          Students ({summary.students.length})
        </p>

        {summary.students.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="w-14 h-14 rounded-full bg-paid-light flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-paid" />
            </div>
            <p className="text-base font-bold text-surface-900">All clear!</p>
            <p className="text-sm text-surface-600">No pending fees this month.</p>
          </div>
        ) : (
          summary.students.map((s) => {
            const isSent = sent.has(s.student_id);
            return (
              <div
                key={s.student_id}
                className="bg-white rounded-2xl border border-surface-200 px-4 py-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-pending-light flex items-center justify-center text-base font-bold text-pending-dark shrink-0">
                  {s.student_name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-surface-900 truncate">{s.student_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-pending">
                      {formatMoney(s.balance)} due
                    </span>
                    {s.batch_name && (
                      <span className="text-xs text-surface-400">· {s.batch_name}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleSend(s)}
                  className={`min-h-tap shrink-0 px-3 rounded-xl text-sm font-semibold flex items-center gap-1.5 ${
                    isSent
                      ? 'bg-paid-light text-paid-dark'
                      : 'bg-pending-light text-pending-dark hover:bg-orange-100'
                  }`}
                >
                  {isSent ? (
                    <><CheckCircle2 className="h-4 w-4" />Sent</>
                  ) : (
                    <><Send className="h-4 w-4" />Remind</>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Authenticated view ────────────────────────────────────────────────────────

function AuthRemindersView() {
  const { data: thisMonth, isLoading } = useThisMonth();
  const generateReminder = useGenerateReminder();
  const [sending, setSending] = useState<string | null>(null);
  const [reminded, setReminded] = useState<Set<string>>(new Set());
  const [copiedNumbers, setCopiedNumbers] = useState(false);


  // All active students who haven't fully paid this month
  const pending = (thisMonth?.students ?? []).filter(
    (s) => s.status === 'PENDING' || s.status === 'PARTIAL',
  );

  const month = thisMonth?.month;
  const year = thisMonth?.year;

  const handleSend = async (s: ThisMonthStudent) => {
    if (sending) return;

    // No fee record yet — build WhatsApp link directly from default_fee
    if (!s.fee_record_id) {
      const balance = Number(s.default_fee);
      const msg = `Dear Parent,\n\n*${formatMoney(balance)}* fee for *${s.student_name}* is pending for ${monthName(month!)} ${year}.\nPlease pay at the earliest. 🙏`;
      window.open(buildWhatsAppLink(s.parent_mobile, msg), '_blank');
      setReminded((prev) => new Set(prev).add(s.student_id));
      return;
    }

    setSending(s.student_id);
    try {
      const result = await generateReminder.mutateAsync({
        student_id: s.student_id,
        fee_record_id: s.fee_record_id,
      });
      window.open(result.whatsapp_link, '_blank');
      setReminded((prev) => new Set(prev).add(s.student_id));
    } finally {
      setSending(null);
    }
  };

  const handleCopyNumbers = async () => {
    const numbers = pending.map((s) => s.parent_mobile).join(', ');
    await navigator.clipboard.writeText(numbers);
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 2000);
  };

  const handleExportCSV = () => {
    if (!pending.length || !month || !year) return;
    const header = 'Student Name,Parent Mobile,Batch,Amount Due,Discount,Paid,Balance';
    const rows = pending.map((s) => {
      const balance = Number(s.amount_due) - Number(s.discount) - Number(s.amount_paid);
      return [
        `"${s.student_name}"`,
        s.parent_mobile,
        `"${s.batch_name ?? ''}"`,
        s.amount_due,
        s.discount,
        s.amount_paid,
        balance,
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending-fees-${monthName(month)}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Reminders" />

      <div className="px-4 py-4 space-y-3">
        {month && year && (
          <p className="text-sm text-surface-600 font-medium">
            {monthName(month)} {year} · Pending Fees
          </p>
        )}

        {isLoading ? (
          <Spinner />
        ) : pending.length === 0 ? (
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
            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyNumbers}
                className="min-h-tap rounded-2xl border border-surface-200 bg-white text-sm font-semibold text-surface-700 flex items-center justify-center gap-2 hover:bg-surface-50"
              >
                <Copy className="h-4 w-4" />
                {copiedNumbers ? 'Copied!' : 'Copy Numbers'}
              </button>
              <button
                onClick={handleExportCSV}
                className="min-h-tap rounded-2xl border border-surface-200 bg-white text-sm font-semibold text-surface-700 flex items-center justify-center gap-2 hover:bg-surface-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>

            <p className="text-xs text-surface-500">
              Tap "Remind" to open WhatsApp with a pre-filled message for that parent.
            </p>

            {pending.map((s) => {
              const balance =
                Number(s.amount_due) - Number(s.discount) - Number(s.amount_paid);
              const isSending = sending === s.student_id;
              const wasReminded = reminded.has(s.student_id);

              return (
                <div
                  key={s.student_id}
                  className="bg-white rounded-2xl border border-surface-200 px-4 py-3 flex items-center gap-3 min-h-tap"
                >
                  <div className="w-10 h-10 rounded-full bg-pending-light flex items-center justify-center text-base font-bold text-pending-dark shrink-0">
                    {s.student_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-surface-900 truncate">
                        {s.student_name}
                      </p>
                      {wasReminded && (
                        <span className="shrink-0 text-xs font-semibold text-paid bg-paid-light px-1.5 py-0.5 rounded-full">
                          Reminded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-pending">
                        {formatMoney(balance)} due
                      </span>
                      {s.batch_name && (
                        <span className="text-xs text-surface-400">· {s.batch_name}</span>
                      )}
                    </div>
                  </div>

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

// ── Router ────────────────────────────────────────────────────────────────────

export function RemindersPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (token) {
    return <MagicRemindersView token={token} />;
  }

  return <AuthRemindersView />;
}
