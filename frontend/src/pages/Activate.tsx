import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import '../components/auth/register/registerForm.css';
import { authApi } from '../services/authApi';
import { mapApiError } from '../utils/mapApiError';

type ActivationStatus = 'idle' | 'pending' | 'success' | 'error';

function Activate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<ActivationStatus>('idle');
  const [message, setMessage] = useState('');

  // Consume the token only on an explicit user click. If we did it automatically
  // on page load, e-mail security scanners / link-preview bots that render the
  // page would "use up" the single-use token before the real user clicks.
  const handleActivate = async () => {
    if (token === '') {
      setStatus('error');
      setMessage('Aktivacioni link nije ispravan ili je nepotpun.');
      return;
    }

    setStatus('pending');
    try {
      const result = await authApi.activate(token);
      setStatus('success');
      setMessage(result.message ?? 'Nalog je aktiviran. Sada se mozete prijaviti.');
    } catch (err) {
      setStatus('error');
      setMessage(mapApiError(err, 'Aktivacija nije uspela.'));
    }
  };

  return (
    <section className="register-main-container">
      <div className="register-card">
        <header className="register-form-header">
          <h1>Aktivacija naloga</h1>
          <p>Kliknite na dugme ispod da aktivirate svoj nalog.</p>
        </header>

        {status !== 'success' ? (
          <button
            type="button"
            className="register-submit-button"
            onClick={() => void handleActivate()}
            disabled={status === 'pending'}
          >
            {status === 'pending' ? 'Aktivacija u toku...' : 'Aktiviraj nalog'}
          </button>
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
