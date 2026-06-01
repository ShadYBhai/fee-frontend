import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="bg-surface-100 rounded-full p-5 mb-4">
        <Icon className="h-10 w-10 text-surface-400" />
      </div>
      <h3 className="text-lg font-semibold text-surface-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-700 mb-6 max-w-xs">{description}</p>}
      {action && <div className="w-full max-w-xs">{action}</div>}
    </div>
  );
}
