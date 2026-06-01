import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Users } from 'lucide-react';
import { useBatches, useDeactivateBatch } from '@/hooks/useBatches';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Batch } from '@/types/batch';

export function BatchesPage() {
  const navigate = useNavigate();
  const { data: batches, isLoading } = useBatches();
  const deactivateMutation = useDeactivateBatch();
  const [toDeactivate, setToDeactivate] = useState<Batch | null>(null);

  const active = (batches ?? []).filter((b) => b.status === 'ACTIVE');
  const inactive = (batches ?? []).filter((b) => b.status === 'INACTIVE');

  return (
    <div>
      <PageHeader
        title="Batches"
        action={
          <button
            onClick={() => navigate('/batches/new')}
            className="min-h-tap min-w-tap flex items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 px-3"
            aria-label="Add batch"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="py-12"><Spinner /></div>
        ) : active.length === 0 && inactive.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No batches yet"
            description="Create a batch to group your students by timing or subject."
            action={
              <button
                onClick={() => navigate('/batches/new')}
                className="w-full min-h-tap-lg rounded-xl bg-brand-500 text-white font-semibold text-base hover:bg-brand-600"
              >
                + Create Batch
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            {active.length > 0 && (
              <section>
                <p className="text-sm text-surface-700 mb-2">{active.length} active batch{active.length !== 1 ? 'es' : ''}</p>
                <div className="space-y-2">
                  {active.map((batch) => (
                    <BatchRow
                      key={batch.id}
                      batch={batch}
                      onEdit={() => navigate(`/batches/${batch.id}/edit`)}
                      onDeactivate={() => setToDeactivate(batch)}
                    />
                  ))}
                </div>
              </section>
            )}

            {inactive.length > 0 && (
              <section>
                <p className="text-sm text-surface-700 mb-2 mt-2">Inactive</p>
                <div className="space-y-2 opacity-60">
                  {inactive.map((batch) => (
                    <BatchRow
                      key={batch.id}
                      batch={batch}
                      onEdit={() => navigate(`/batches/${batch.id}/edit`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDeactivate}
        title="Deactivate Batch?"
        description={`"${toDeactivate?.name}" will be marked inactive. Students in this batch won't be removed.`}
        confirmLabel="Yes, Deactivate"
        variant="danger"
        loading={deactivateMutation.isPending}
        onConfirm={async () => {
          if (toDeactivate) {
            await deactivateMutation.mutateAsync(toDeactivate.id);
            setToDeactivate(null);
          }
        }}
        onCancel={() => setToDeactivate(null)}
      />
    </div>
  );
}

function BatchRow({
  batch,
  onEdit,
  onDeactivate,
}: {
  batch: Batch;
  onEdit: () => void;
  onDeactivate?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-surface-900 truncate">{batch.name}</p>
          <p className="text-sm text-surface-700">
            {[batch.subject, batch.timing].filter(Boolean).join(' · ') || 'No details'}
          </p>
          {batch._count !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <Users className="h-3.5 w-3.5 text-surface-400" />
              <span className="text-xs text-surface-500">{batch._count.students} student{batch._count.students !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-2">
          <button
            onClick={onEdit}
            className="min-h-tap px-3 rounded-lg text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            Edit
          </button>
          {onDeactivate && (
            <button
              onClick={onDeactivate}
              className="min-h-tap px-3 rounded-lg text-sm font-semibold text-pending hover:bg-pending-light"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
