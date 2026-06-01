import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Brand strip */}
      <div className="bg-brand-500 h-2 w-full flex-shrink-0" />
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-3">
              <span className="text-white text-2xl font-black">FF</span>
            </div>
            <h1 className="text-2xl font-black text-surface-900">FeeFlow</h1>
            <p className="text-sm text-surface-700 mt-1">Fee management for coaching centers</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
