import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
        success:   'bg-paid text-white hover:bg-green-700',
        danger:    'bg-pending text-white hover:bg-red-700',
        warning:   'bg-partial text-white hover:bg-amber-600',
        outline:   'border-2 border-brand-500 text-brand-500 bg-white hover:bg-brand-50',
        ghost:     'text-surface-700 hover:bg-surface-100',
        secondary: 'bg-surface-100 text-surface-900 hover:bg-surface-200',
      },
      size: {
        sm:   'min-h-tap text-sm px-4 py-2',
        md:   'min-h-tap text-base px-5 py-3',
        lg:   'min-h-tap-lg text-lg px-6 py-4',
        full: 'min-h-tap-lg text-lg px-6 py-4 w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
        </svg>
      )}
      {children}
    </button>
  );
}
