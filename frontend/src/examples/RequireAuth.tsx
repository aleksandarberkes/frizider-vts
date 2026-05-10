import { ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Wrapper that only renders `children` if a user is logged in.
// Use it to gate routes/sections that require authentication.
//
//   <RequireAuth fallback={<LoginForm />}>
//     <Dashboard />
//   </RequireAuth>

export function RequireAuth({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading…</div>;
  if (!user) return <>{fallback ?? <div>You must be logged in.</div>}</>;
  return <>{children}</>;
}
