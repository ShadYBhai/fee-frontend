import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useBatch, useCreateBatch, useUpdateBatch } from '@/hooks/useBatches';

export function BatchFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';

  const { data: batch, isLoading } = useBatch(isEdit ? id : '');
  const createMutation = useCreateBatch();
  const updateMutation = useUpdateBatch();

  const [form, setForm] = useState({ name: '', timing: '', subject: '' });
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (batch) {
      setForm({
        name: batch.name,
        timing: batch.timing ?? '',
        subject: batch.subject ?? '',
      });
    }
  }, [batch]);

  const validate = () => {
    const e: { name?: string } = {};
    if (!form.name.trim()) e.name = 'Batch name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      timing: form.timing.trim() || undefined,
      subject: form.subject.trim() || undefined,
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id, data: payload });
      navigate('/batches');
    } else {
      await createMutation.mutateAsync(payload);
      navigate('/batches');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title="Edit Batch" back />
        <div className="py-12"><Spinner /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Batch' : 'New Batch'} back />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        <Input
          label="Batch Name"
          placeholder="e.g. Morning Batch, Class 10"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
        />

        <Input
          label="Timing (optional)"
          placeholder="e.g. 7 AM – 9 AM"
          value={form.timing}
          onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))}
        />

        <Input
          label="Subject (optional)"
          placeholder="e.g. Mathematics, Music"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
        />

        <div className="pt-2">
          <Button type="submit" size="full" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Batch'}
          </Button>
        </div>
      </form>
    </div>
  );
}
