import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="h-10 w-10 rounded-full border-4 border-surface-200 border-t-brand-500 animate-spin" />
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-surface-200 border-t-brand-500 animate-spin" />
        <p className="text-base text-surface-700">Loading...</p>
      </div>
    </div>
  );
}
