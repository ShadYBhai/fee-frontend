import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Camera, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { updateProfile, uploadLogo } from '@/api/auth.api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PlanBadge } from '@/components/ui/Badge';

export function SettingsPage() {
  const navigate = useNavigate();
  const owner = useAuthStore((s) => s.owner);
  const updateOwner = useAuthStore((s) => s.updateOwner);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [form, setForm] = useState({
    name: owner?.name ?? '',
    institute_name: owner?.institute_name ?? '',
    upi_id: owner?.upi_id ?? '',
  });
  const [errors, setErrors] = useState<{ name?: string; institute_name?: string }>({});
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.institute_name.trim()) e.institute_name = 'Institute name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await updateProfile({ name: form.name.trim(), institute_name: form.institute_name.trim(), upi_id: form.upi_id.trim() || undefined });
      updateOwner(updated);
      toast.success('Profile saved!');
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      toast.error(e.displayMessage ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB.');
      return;
    }
    setUploadingLogo(true);
    try {
      const result = await uploadLogo(file);
      updateOwner({ ...owner!, logo_url: result.logo_url });
      toast.success('Logo updated!');
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      toast.error(e.displayMessage ?? 'Could not upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="px-4 py-4 space-y-5">
        {/* Logo + plan */}
        <Card className="p-4 flex items-center gap-4">
          <div className="relative">
            {owner?.logo_url ? (
              <img
                src={owner.logo_url}
                alt="Institute logo"
                className="w-16 h-16 rounded-2xl object-cover border border-surface-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-600">
                {owner?.institute_name?.charAt(0)?.toUpperCase() ?? 'F'}
              </div>
            )}
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md"
              aria-label="Change logo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-surface-900 truncate">
              {owner?.institute_name ?? 'Your Institute'}
            </p>
            <p className="text-sm text-surface-700 truncate">{owner?.mobile}</p>
            <div className="mt-1">
              {owner?.plan && <PlanBadge plan={owner.plan} />}
            </div>
          </div>
        </Card>

        {/* Profile form */}
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Your Name"
            placeholder="e.g. Rajesh Sharma"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={errors.name}
          />
          <Input
            label="Institute Name"
            placeholder="e.g. Sharma Classes"
            value={form.institute_name}
            onChange={(e) => setForm((f) => ({ ...f, institute_name: e.target.value }))}
            error={errors.institute_name}
          />
          <div>
            <Input
              label="UPI ID (optional)"
              placeholder="e.g. sharma@upi or 9876543210@okaxis"
              value={form.upi_id}
              onChange={(e) => setForm((f) => ({ ...f, upi_id: e.target.value }))}
            />
            <p className="text-xs text-surface-500 mt-1">
              Added to reminder messages so parents can pay directly via UPI.
            </p>
          </div>
          <Button type="submit" size="full" loading={saving}>
            Save Profile
          </Button>
        </form>

        {/* Billing link */}
        <button
          onClick={() => navigate('/billing')}
          className="w-full bg-white rounded-2xl border border-surface-200 px-4 py-3 flex items-center justify-between min-h-tap"
        >
          <span className="text-base font-semibold text-surface-900">Billing & Plans</span>
          <ChevronRight className="h-5 w-5 text-surface-400" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full text-center text-base font-semibold text-pending py-3 rounded-xl border border-pending/30 hover:bg-pending-light"
        >
          <LogOut className="inline h-5 w-5 mr-2 -mt-0.5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
