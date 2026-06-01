import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { verifyOtp, sendOtp } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { getMe } from '@/api/auth.api';

const RESEND_SECONDS = 60;

export function OtpPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mobile = params.get('mobile') ?? '';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus OTP input
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the full 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const { accessToken } = await verifyOtp(mobile, otp);
      // Set auth first so axios interceptor picks up the token for getMe
      setAuth(accessToken, { id: '', name: null, mobile, institute_name: null, logo_url: null, upi_id: null, plan: 'TRIAL', plan_expiry: null, created_at: '' });
      const owner = await getMe();
      setAuth(accessToken, owner);
      toast.success(owner.name ? `Welcome back, ${owner.name}!` : 'Welcome to FeeFlow!');
      navigate('/');
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      toast.error(e.displayMessage ?? 'Wrong OTP. Please try again.');
      setOtp('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!mobile) return;
    try {
      await sendOtp(mobile);
      setResendTimer(RESEND_SECONDS);
      toast.success('New OTP sent!');
    } catch {
      toast.error('Could not resend OTP. Please try again.');
    }
  };

  const maskedMobile = mobile ? `+91 XXXXXXX${mobile.slice(-3)}` : '';

  return (
    <AuthLayout>
      <form onSubmit={handleVerify} className="flex flex-col gap-5">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-50 rounded-full mb-3">
            <ShieldCheck className="h-7 w-7 text-brand-500" />
          </div>
          <p className="text-base text-surface-700">
            OTP sent to <span className="font-semibold text-surface-900">{maskedMobile}</span>
          </p>
          <Link to="/login" className="text-sm text-brand-500 underline mt-1 inline-block">
            Wrong number? Change it
          </Link>
        </div>

        <div>
          <label htmlFor="otp" className="block text-sm font-semibold text-surface-900 mb-2 text-center">
            Enter 6-digit OTP
          </label>
          <input
            ref={inputRef}
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="• • • • • •"
            className="w-full min-h-tap-lg rounded-xl border border-surface-200 bg-white px-4 text-3xl font-bold text-center tracking-[0.5em] text-surface-900 placeholder-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <Button type="submit" size="full" loading={loading} disabled={otp.length !== 6}>
          Verify & Login
        </Button>

        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-surface-700">
              Resend OTP in{' '}
              <span className="font-semibold text-surface-900">
                {Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm font-semibold text-brand-500 underline"
            >
              Resend OTP
            </button>
          )}
        </div>

        {/* Dev hint */}
        {import.meta.env.DEV && (
          <p className="text-xs text-center text-surface-400 bg-surface-100 rounded-lg py-2">
            Dev mode: use OTP <strong>123456</strong>
          </p>
        )}
      </form>
    </AuthLayout>
  );
}
