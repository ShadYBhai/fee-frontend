import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  back?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, back, action, className }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className={cn('flex items-center gap-3 py-4 px-4 bg-white border-b border-surface-200 sticky top-0 z-10', className)}>
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="min-h-tap min-w-tap flex items-center justify-center rounded-xl hover:bg-surface-100 -ml-2"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6 text-surface-900" />
        </button>
      )}
      <h1 className="flex-1 text-xl font-bold text-surface-900 truncate">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  );
}
