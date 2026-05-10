import {
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import LoginModal from '../components/auth/login/LoginModal';

type AuthModalContextValue = {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const value = useMemo(
    () => ({
      isLoginModalOpen,
      openLoginModal: () => setIsLoginModalOpen(true),
      closeLoginModal: () => setIsLoginModalOpen(false),
    }),
    [isLoginModalOpen],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={value.closeLoginModal} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error('useAuthModal must be used inside <AuthModalProvider>.');
  }

  return context;
}
