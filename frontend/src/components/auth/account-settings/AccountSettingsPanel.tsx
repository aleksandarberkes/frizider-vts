import { FormEvent, useState } from 'react';
import { api, ApiError } from '../../../api';
import '../user-profile/userProfilePanel.css';

function AccountSettingsPanel() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const mapError = (err: unknown, fallback: string) => {
    if (err instanceof TypeError) {
      return 'Backend nije dostupan na http://localhost/frizider-vts/backend.';
    }
    if (err instanceof ApiError || err instanceof Error) {
      return err.message;
    }
    return fallback;
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Nova lozinka i potvrda lozinke moraju da se poklapaju.');
      return;
    }

    setSavingPassword(true);

    try {
      await api.post('/api/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Lozinka je uspesno promenjena.');
    } catch (err) {
      setPasswordError(mapError(err, 'Promena lozinke nije uspela.'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <section className="profile-card profile-card--wide">
      <header className="profile-card-header profile-card-header--stack">
        <div>
          <h2>Podesavanja Naloga</h2>
        </div>
      </header>

      <form className="profile-form" onSubmit={handlePasswordSubmit}>
        <div className="profile-field">
          <label htmlFor="current-password">Trenutna Lozinka</label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="profile-field">
          <label htmlFor="new-password">Nova Lozinka</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>

        <div className="profile-field">
          <label htmlFor="confirm-new-password">Potvrdi Novu Lozinku</label>
          <input
            id="confirm-new-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>

        {passwordError ? (
          <p className="profile-message profile-message--error">{passwordError}</p>
        ) : null}
        {passwordSuccess ? (
          <p className="profile-message profile-message--success">{passwordSuccess}</p>
        ) : null}

        <button type="submit" className="profile-button" disabled={savingPassword}>
          {savingPassword ? 'Menjanje...' : 'Promeni Lozinku'}
        </button>
      </form>
    </section>
  );
}

export default AccountSettingsPanel;
