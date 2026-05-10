import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useAuthModal } from '../../auth/AuthModalContext';

function RequireAdmin({ children }: { children: ReactNode }) {
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

  if (user.role_name !== 'admin') {
    return <Navigate to="/fridge" replace />;
  }

  return <>{children}</>;
}

export default RequireAdmin;
