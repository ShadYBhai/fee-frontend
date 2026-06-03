import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
}

export function Input({ label, error, hint, prefix, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-surface-900">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-surface-700 select-none">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full min-h-tap rounded-xl border bg-white px-4 py-3 text-base text-surface-900 placeholder-surface-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            'disabled:bg-surface-100 disabled:cursor-not-allowed',
            error ? 'border-pending' : 'border-surface-200',
            prefix ? 'pl-8' : '',
            className,
          )}
          {...props}
        />
      </div>
      {hint && !error && <p className="text-xs text-surface-500">{hint}</p>}
      {error && <p className="text-sm text-pending font-medium">{error}</p>}
    </div>
  );
}
