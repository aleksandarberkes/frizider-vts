import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { ApiError } from '../../../api';
import './loginModal.css';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      onClose();
    }
  }, [isOpen, onClose, user]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Backend nije dostupan na http://localhost/frizider-vts/backend.');
      } else if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError('Prijava nije uspela.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="login-modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button
          className="login-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Zatvori prijavu"
        >
          <img src="/icons/close-icon.svg" alt="" />
        </button>

        <header className="register-form-header login-modal-header">
          <h1 id="login-modal-title">Prijava</h1>
          <p>Prijavite se i nastavite do svog frižidera i administratorskih opcija.</p>
        </header>

        <form className="register-form login-modal-form" onSubmit={handleSubmit}>
          <div className="register-field">
            <label htmlFor="login-email">Email Adresa</label>
            <div className="register-input-wrap">
              <img src="/icons/email-icon.svg" alt="" className="register-input-icon" />
              <input
                className="register-input"
                type="email"
                id="login-email"
                name="email"
                placeholder="markomarkovic@gmail.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="login-password">Lozinka</label>
            <div className="register-input-wrap">
              <img src="/icons/password-icon.svg" alt="" className="register-input-icon" />
              <input
                className="register-input"
                type="password"
                id="login-password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error ? <p className="register-form-message register-form-error">{error}</p> : null}

          <button type="submit" className="register-submit-button" disabled={submitting}>
            {submitting ? 'Prijavljivanje...' : 'Prijavi se'}
          </button>
        </form>

        <p className="login-modal-register-link">
          Nemaš nalog? <Link to="/register" onClick={onClose}>Registruj se</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginModal;
