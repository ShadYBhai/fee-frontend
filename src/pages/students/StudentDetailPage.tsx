import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Phone, Edit, MessageCircle, Plus, BookOpen } from 'lucide-react';
import { useStudent, useDeactivateStudent } from '@/hooks/useStudents';
import { useFees } from '@/hooks/useFees';
import { useGenerateReminder } from '@/hooks/useReminders';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { FeeStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatMoney, formatPeriod, formatDate } from '@/lib/utils';
import type { FeeRecord } from '@/types/fee';

export function StudentDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [reminderLoading, setReminderLoading] = useState<string | null>(null);

  const { data: student, isLoading: loadingStudent } = useStudent(id!);
  const { data: feesData, isLoading: loadingFees } = useFees({ student_id: id });
  const deactivateMutation = useDeactivateStudent();
  const generateReminder = useGenerateReminder();

  const fees = feesData?.data ?? [];
  const pendingFees = fees.filter((f) => f.status !== 'PAID');

  const handleSendReminder = async (fee: FeeRecord) => {
    setReminderLoading(fee.id);
    try {
      const result = await generateReminder.mutateAsync({
        student_id: fee.student_id,
        fee_record_id: fee.id,
      });
      window.open(result.whatsapp_link, '_blank');
    } finally {
      setReminderLoading(null);
    }
  };

  const handleDeactivate = async () => {
    await deactivateMutation.mutateAsync(id!);
    navigate('/students');
  };

  if (loadingStudent) {
    return (
      <div>
        <PageHeader title="Student" back />
        <div className="py-12"><Spinner /></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div>
        <PageHeader title="Student" back />
        <div className="px-4 py-12 text-center text-surface-700">Student not found.</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={student.name}
        back
        action={
          <button
            onClick={() => navigate(`/students/${id}/edit`)}
            className="min-h-tap min-w-tap flex items-center justify-center rounded-xl hover:bg-surface-100"
            aria-label="Edit student"
          >
            <Edit className="h-5 w-5 text-surface-700" />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Profile card */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-600 select-none">
              {student.name.charAt(0).toUpperCase()}
            </div>
            {student.status === 'INACTIVE' && (
              <span className="text-xs font-semibold bg-surface-100 text-surface-600 px-3 py-1 rounded-full">
                Inactive
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-surface-900">
              <Phone className="h-4 w-4 text-surface-500 shrink-0" />
              <a
                href={`tel:+91${student.parent_mobile}`}
                className="text-base font-medium"
              >
                +91 {student.parent_mobile}
              </a>
            </div>
            {student.batch && (
              <div className="flex items-center gap-2 text-surface-900">
                <BookOpen className="h-4 w-4 text-surface-500 shrink-0" />
                <span className="text-base">{student.batch.name}</span>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              <div>
                <p className="text-xs text-surface-500">Monthly Fee</p>
                <p className="text-base font-bold text-surface-900">{formatMoney(student.default_fee)}</p>
              </div>
              <div className="w-px h-8 bg-surface-200" />
              <div>
                <p className="text-xs text-surface-500">Since</p>
                <p className="text-base font-semibold text-surface-900">{formatDate(student.admission_date)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/fees/new?student_id=${id}`)}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
          {pendingFees.length > 0 && (
            <Button
              variant="warning"
              size="md"
              onClick={() => handleSendReminder(pendingFees[0])}
              loading={reminderLoading === pendingFees[0].id}
              className="w-full"
            >
              <MessageCircle className="h-4 w-4" />
              Send Reminder
            </Button>
          )}
        </div>

        {/* Fee history */}
        <section>
          <h2 className="text-lg font-bold text-surface-900 mb-3">Fee History</h2>
          {loadingFees ? (
            <Spinner />
          ) : fees.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No payments yet"
              description="Record the first payment for this student."
            />
          ) : (
            <div className="space-y-2">
              {fees.map((fee) => (
                <button
                  key={fee.id}
                  onClick={() => navigate(`/fees/${fee.id}`)}
                  className="w-full bg-white rounded-2xl border border-surface-200 px-4 py-3 flex items-center justify-between text-left min-h-tap active:bg-surface-50"
                >
                  <div>
                    <p className="text-base font-semibold text-surface-900">
                      {formatPeriod(fee.month_from, fee.year_from, fee.month_to, fee.year_to)}
                    </p>
                    <p className="text-sm text-surface-700">
                      {fee.payment_date ? formatDate(fee.payment_date) : 'Unpaid'}
                      {fee.status !== 'PAID' && ` · ${formatMoney(fee.amount_due - fee.discount - fee.amount_paid)} due`}
                    </p>
                  </div>
                  <div className="text-right">
                    <FeeStatusBadge status={fee.status} />
                    {fee.amount_paid > 0 && (
                      <p className="text-sm text-paid font-semibold mt-1">+{formatMoney(fee.amount_paid)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Deactivate */}
        {student.status === 'ACTIVE' && (
          <div className="pt-4 pb-2">
            <button
              onClick={() => setShowDeactivate(true)}
              className="w-full text-center text-sm text-pending font-semibold py-3 rounded-xl border border-pending/30 hover:bg-pending-light"
            >
              Deactivate Student
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeactivate}
        title="Deactivate Student?"
        description={`${student.name} will be marked inactive and hidden from the active list. You can search for them later.`}
        confirmLabel="Yes, Deactivate"
        variant="danger"
        loading={deactivateMutation.isPending}
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivate(false)}
      />
    </div>
  );
}
