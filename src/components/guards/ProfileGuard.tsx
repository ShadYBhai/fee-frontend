import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export function ProfileGuard() {
  const owner = useAuthStore((s) => s.owner);
  // If profile is incomplete, force setup
  if (!owner?.name || !owner?.institute_name) {
    return <Navigate to="/setup" replace />;
  }
  return <Outlet />;
}
