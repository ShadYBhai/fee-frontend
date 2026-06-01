import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useBatches } from '@/hooks/useBatches';
import { useStudent, useCreateStudent, useUpdateStudent } from '@/hooks/useStudents';

export function StudentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = !!id && id !== 'new';
  const presetBatchId = searchParams.get('batch_id') ?? '';

  const { data: student, isLoading: loadingStudent } = useStudent(isEdit ? id : '');
  const { data: batchesData } = useBatches();
  const batches = batchesData ?? [];

  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();

  const [form, setForm] = useState({
    name: '',
    parent_mobile: '',
    batch_id: presetBatchId,
    default_fee: '',
    admission_date: new Date().toISOString().slice(0, 10),
  });

  const [errors, setErrors] = useState<Partial<typeof form>>({});

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name,
        parent_mobile: student.parent_mobile,
        batch_id: student.batch_id ?? '',
        default_fee: String(student.default_fee),
        admission_date: student.admission_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      });
    }
  }, [student]);

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^[6-9]\d{9}$/.test(form.parent_mobile)) e.parent_mobile = 'Enter valid 10-digit mobile (starts with 6–9)';
    const fee = parseFloat(form.default_fee);
    if (isNaN(fee) || fee < 0) e.default_fee = 'Enter a valid fee amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      parent_mobile: form.parent_mobile,
      batch_id: form.batch_id || undefined,
      default_fee: parseFloat(form.default_fee),
      admission_date: form.admission_date || undefined,
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id, data: payload });
      navigate(`/students/${id}`);
    } else {
      const created = await createMutation.mutateAsync(payload);
      navigate(`/students/${created.id}`);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEdit && loadingStudent) {
    return (
      <div>
        <PageHeader title="Edit Student" back />
        <div className="py-12"><Spinner /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Student' : 'Add Student'} back />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        <Input
          label="Student Name"
          placeholder="e.g. Priya Sharma"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
        />

        <div>
          <label className="block text-sm font-semibold text-surface-900 mb-2">
            Parent / Guardian Mobile
          </label>
          <div className="flex items-stretch">
            <span className="flex items-center px-4 bg-surface-100 border border-r-0 border-surface-200 rounded-l-xl text-base font-semibold text-surface-700 select-none">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="98765 43210"
              value={form.parent_mobile}
              onChange={(e) => setForm((f) => ({ ...f, parent_mobile: e.target.value.replace(/\D/g, '') }))}
              className={`flex-1 min-h-tap-lg rounded-r-xl border bg-white px-4 text-xl tracking-widest text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${errors.parent_mobile ? 'border-pending' : 'border-surface-200'}`}
            />
          </div>
          {errors.parent_mobile && <p className="mt-1.5 text-sm text-pending font-medium">{errors.parent_mobile}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-900 mb-2">
            Batch <span className="text-surface-500 font-normal">(optional)</span>
          </label>
          <select
            value={form.batch_id}
            onChange={(e) => setForm((f) => ({ ...f, batch_id: e.target.value }))}
            className="w-full min-h-tap-lg rounded-xl border border-surface-200 bg-white px-4 text-base text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">No batch</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}{b.timing ? ` · ${b.timing}` : ''}</option>
            ))}
          </select>
        </div>

        <Input
          label="Monthly Fee (₹)"
          type="number"
          placeholder="e.g. 1500"
          prefix="₹"
          value={form.default_fee}
          onChange={(e) => setForm((f) => ({ ...f, default_fee: e.target.value }))}
          error={errors.default_fee}
        />

        <Input
          label="Admission Date"
          type="date"
          value={form.admission_date}
          onChange={(e) => setForm((f) => ({ ...f, admission_date: e.target.value }))}
        />

        <div className="pt-2">
          <Button type="submit" size="full" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Student'}
          </Button>
        </div>
      </form>
    </div>
  );
}
