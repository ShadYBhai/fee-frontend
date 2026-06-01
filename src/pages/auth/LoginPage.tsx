import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Phone } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { sendOtp } from '@/api/auth.api';

export function LoginPage() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simple validation
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number (starts with 6–9)');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(mobile);
      toast.success('OTP sent to your mobile!');
      navigate(`/otp?mobile=${mobile}`);
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      toast.error(e.displayMessage ?? 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="mobile" className="block text-sm font-semibold text-surface-900 mb-2">
            Your Mobile Number
          </label>
          <div className="flex items-stretch">
            <span className="flex items-center px-4 bg-surface-100 border border-r-0 border-surface-200 rounded-l-xl text-base font-semibold text-surface-700 select-none">
              +91
            </span>
            <input
              id="mobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="98765 43210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              className={`flex-1 min-h-tap-lg rounded-r-xl border bg-white px-4 text-xl tracking-widest text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${error ? 'border-pending' : 'border-surface-200'}`}
            />
          </div>
          {error && <p className="mt-1.5 text-sm text-pending font-medium">{error}</p>}
        </div>

        <Button type="submit" size="full" loading={loading}>
          <Phone className="h-5 w-5" />
          Get OTP
        </Button>

        <p className="text-sm text-surface-700 text-center">
          No password needed. We'll send a 6-digit code to your phone.
        </p>
      </form>
    </AuthLayout>
  );
}
