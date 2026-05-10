import { ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Wrapper that only renders `children` for admins.
// Anonymous → fallback. Logged-in non-admin → "admins only" message.
//
//   <RequireAdmin>
//     <UsersList />
//   </RequireAdmin>

export function RequireAdmin({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading…</div>;
  if (!user) return <>{fallback ?? <div>You must be logged in.</div>}</>;
  if (user.role_name !== 'admin') return <div>Admins only.</div>;
  return <>{children}</>;
}
