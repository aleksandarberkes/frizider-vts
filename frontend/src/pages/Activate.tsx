import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import '../components/auth/register/registerForm.css';
import { authApi } from '../services/authApi';
import { mapApiError } from '../utils/mapApiError';

type ActivationStatus = 'pending' | 'success' | 'error';

function Activate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<ActivationStatus>('pending');
  const [message, setMessage] = useState('Aktivacija u toku...');
  // Guard against React 18 StrictMode double-invocation consuming the token twice.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    if (token === '') {
      setStatus('error');
      setMessage('Aktivacioni link nije ispravan ili je nepotpun.');
      return;
    }

    const activate = async () => {
      try {
        const result = await authApi.activate(token);
        setStatus('success');
        setMessage(result.message ?? 'Nalog je aktiviran. Sada se mozete prijaviti.');
      } catch (err) {
        setStatus('error');
        setMessage(mapApiError(err, 'Aktivacija nije uspela.'));
      }
    };

    void activate();
  }, [token]);

  return (
    <section className="register-main-container">
      <div className="register-card">
        <header className="register-form-header">
          <h1>Aktivacija naloga</h1>
        </header>

        {status === 'pending' ? (
          <p className="register-form-message">{message}</p>
        ) : null}

        {status === 'success' ? (
          <p className="register-form-message register-form-success">
            {message} <Link to="/login">Prijavite se</Link>
          </p>
        ) : null}

        {status === 'error' ? (
          <p className="register-form-message register-form-error">
            {message} <Link to="/register">Registrujte se ponovo</Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default Activate;
