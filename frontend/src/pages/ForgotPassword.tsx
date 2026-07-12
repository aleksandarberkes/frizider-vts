import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import '../components/auth/register/registerForm.css';
import { authApi } from '../services/authApi';
import { mapApiError } from '../utils/mapApiError';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const result = await authApi.forgotPassword(email.trim());
      setSuccessMessage(
        result.message ??
          'Ako nalog sa tim e-mailom postoji, poslali smo link za promenu lozinke.',
      );
    } catch (err) {
      setError(mapApiError(err, 'Slanje linka nije uspelo.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="register-main-container">
      <div className="register-card">
        <header className="register-form-header">
          <h1>Zaboravljena lozinka</h1>
          <p>Unesite e-mail i poslacemo vam link za promenu lozinke.</p>
        </header>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-field">
            <label htmlFor="email">Email Adresa</label>
            <div className="register-input-wrap">
              <img src="/appicons/email-icon.svg" alt="" className="register-input-icon" />
              <input
                className="register-input"
                type="email"
                name="email"
                id="email"
                placeholder="markomarkovic@gmail.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {error ? <p className="register-form-message register-form-error">{error}</p> : null}
          {successMessage ? (
            <p className="register-form-message register-form-success">{successMessage}</p>
          ) : null}

          <button type="submit" className="register-submit-button" disabled={submitting}>
            {submitting ? 'Slanje...' : 'Posalji link'}
          </button>
        </form>

        <p className="register-form-message">
          <Link to="/login">Nazad na prijavu</Link>
        </p>
      </div>
    </section>
  );
}

export default ForgotPassword;
