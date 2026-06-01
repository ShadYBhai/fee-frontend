import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';

// Guards & layouts
import { AuthGuard } from '@/components/guards/AuthGuard';
import { ProfileGuard } from '@/components/guards/ProfileGuard';
import { AppShell } from '@/components/layout/AppShell';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { OtpPage } from '@/pages/auth/OtpPage';
import { ProfileSetupPage } from '@/pages/auth/ProfileSetupPage';

// App pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { StudentsPage } from '@/pages/students/StudentsPage';
import { StudentFormPage } from '@/pages/students/StudentFormPage';
import { StudentDetailPage } from '@/pages/students/StudentDetailPage';
import { BatchesPage } from '@/pages/batches/BatchesPage';
import { BatchFormPage } from '@/pages/batches/BatchFormPage';
import { RecordFeePage } from '@/pages/fees/RecordFeePage';
import { FeeDetailPage } from '@/pages/fees/FeeDetailPage';
import { RemindersPage } from '@/pages/reminders/RemindersPage';
import { BillingPage } from '@/pages/billing/BillingPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/otp" element={<OtpPage />} />

          {/* Profile setup — requires token but no complete profile */}
          <Route element={<AuthGuard />}>
            <Route path="/setup" element={<ProfileSetupPage />} />
          </Route>

          {/* Protected app routes */}
          <Route element={<AuthGuard />}>
            <Route element={<ProfileGuard />}>
              <Route element={<AppShell />}>
                {/* Dashboard (home) */}
                <Route path="/" element={<DashboardPage />} />

                {/* Students */}
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/new" element={<StudentFormPage />} />
                <Route path="/students/:id" element={<StudentDetailPage />} />
                <Route path="/students/:id/edit" element={<StudentFormPage />} />

                {/* Batches */}
                <Route path="/batches" element={<BatchesPage />} />
                <Route path="/batches/new" element={<BatchFormPage />} />
                <Route path="/batches/:id/edit" element={<BatchFormPage />} />

                {/* Fees */}
                <Route path="/fees/new" element={<RecordFeePage />} />
                <Route path="/fees/:id" element={<FeeDetailPage />} />

                {/* Reminders */}
                <Route path="/reminders" element={<RemindersPage />} />

                {/* Billing */}
                <Route path="/billing" element={<BillingPage />} />

                {/* Settings */}
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
