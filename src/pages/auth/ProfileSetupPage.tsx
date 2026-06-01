import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateProfile } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const updateOwner = useAuthStore((s) => s.updateOwner);
  const owner = useAuthStore((s) => s.owner);

  const [form, setForm] = useState({
    institute_name: owner?.institute_name ?? '',
    name: owner?.name ?? '',
  });
  const [errors, setErrors] = useState({ institute_name: '', name: '' });
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = { institute_name: '', name: '' };
    if (!form.institute_name.trim()) e.institute_name = 'Institute name is required';
    if (!form.name.trim()) e.name = 'Your name is required';
    setErrors(e);
    return !e.institute_name && !e.name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const updated = await updateProfile({ name: form.name.trim(), institute_name: form.institute_name.trim() });
      updateOwner(updated);
      toast.success(`Welcome to FeeFlow, ${updated.name}!`);
      navigate('/');
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      toast.error(e.displayMessage ?? 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-surface-900">Set up your profile</h2>
        <p className="text-sm text-surface-700 mt-1">This takes 30 seconds. You only do this once.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Institute / Coaching Center Name"
          placeholder="e.g. Sharma Classes"
          value={form.institute_name}
          onChange={(e) => setForm((f) => ({ ...f, institute_name: e.target.value }))}
          error={errors.institute_name}
        />

        <Input
          label="Your Name (Owner)"
          placeholder="e.g. Rajesh Sharma"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
        />

        <Button type="submit" size="full" loading={loading}>
          Save & Continue
        </Button>
      </form>
    </AuthLayout>
  );
}
