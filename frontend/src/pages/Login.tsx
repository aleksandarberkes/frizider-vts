import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useAuthModal } from '../auth/AuthModalContext';

function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
      return;
    }

    openLoginModal();
    navigate('/', { replace: true });
  }, [navigate, openLoginModal, user]);

  return null;
}

export default Login;
