import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useAuthModal } from '../../auth/AuthModalContext';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { openLoginModal } = useAuthModal();

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
    }
  }, [loading, openLoginModal, user]);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default RequireAuth;
