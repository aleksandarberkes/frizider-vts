import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import '../components/auth/register/registerForm.css';
import { authApi } from '../services/authApi';
import { mapApiError } from '../utils/mapApiError';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (token === '') {
      setError('Link nije ispravan. Zatrazite novi.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await authApi.resetPassword(token, password);
      setSuccessMessage(
        result.message ?? 'Lozinka je promenjena. Sada se mozete prijaviti.',
      );
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(mapApiError(err, 'Promena lozinke nije uspela.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="register-main-container">
      <div className="register-card">
        <header className="register-form-header">
          <h1>Nova lozinka</h1>
          <p>Postavite novu lozinku za svoj nalog.</p>
        </header>

        {token === '' ? (
          <p className="register-form-message register-form-error">
            Link nije ispravan ili je nepotpun. Zatrazite novi na strani
            &nbsp;<Link to="/forgot-password">Zaboravljena lozinka</Link>.
          </p>
        ) : (
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="register-field">
              <label htmlFor="password">Nova lozinka</label>
              <div className="register-input-wrap">
                <img src="/icons/password-icon.svg" alt="" className="register-input-icon" />
                <input
                  className="register-input"
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="confirmPassword">Potvrdite lozinku</label>
              <div className="register-input-wrap">
                <img src="/icons/password-icon.svg" alt="" className="register-input-icon" />
                <input
                  className="register-input"
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {error ? <p className="register-form-message register-form-error">{error}</p> : null}
            {successMessage ? (
              <p className="register-form-message register-form-success">
                {successMessage} <Link to="/login">Prijavite se</Link>
              </p>
            ) : null}

            <button type="submit" className="register-submit-button" disabled={submitting}>
              {submitting ? 'Cuvanje...' : 'Sacuvaj lozinku'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default ResetPassword;
