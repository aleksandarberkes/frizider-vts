import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../../../api';
import { useAuth } from '../../../auth/AuthContext';
import './userProfilePanel.css';

type ProfileResponse = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role_id: number;
  role_name: 'admin' | 'user';
  is_active: boolean;
};

function UserProfilePanel() {
  const { user, refresh } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setFirstName(user?.first_name ?? '');
    setLastName(user?.last_name ?? '');
    setPhone(user?.phone ?? '');
  }, [user]);

  if (!user) {
    return null;
  }

  const mapError = (err: unknown, fallback: string) => {
    if (err instanceof TypeError) {
      return 'Backend nije dostupan na http://localhost/frizider-vts/backend.';
    }
    if (err instanceof ApiError || err instanceof Error) {
      return err.message;
    }
    return fallback;
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setSavingProfile(true);

    try {
      await api.put<ProfileResponse>('/api/users/me', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      });
      await refresh();
      setProfileSuccess('Profil je uspesno azuriran.');
    } catch (err) {
      setProfileError(mapError(err, 'Izmena profila nije uspela.'));
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <section className="profile-card profile-card--wide">
      <header className="profile-card-header profile-card-header--stack">
        <div>
          <h2>Podaci o Profilu</h2>
          <p className="profile-subtitle">Azurirajte svoje licne informacije</p>
        </div>
        <span className="profile-role-badge">
          {user.role_name === 'admin' ? 'Administrator' : 'Korisnik'}
        </span>
      </header>

      <form className="profile-form" onSubmit={handleProfileSubmit}>
        <div className="profile-field-row">
          <div className="profile-field">
            <label htmlFor="profile-first-name">Ime</label>
            <input
              id="profile-first-name"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
            />
          </div>

          <div className="profile-field">
            <label htmlFor="profile-last-name">Prezime</label>
            <input
              id="profile-last-name"
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        <div className="profile-field">
          <label htmlFor="profile-email">Email</label>
          <input id="profile-email" type="email" value={user.email} disabled />
        </div>

        <div className="profile-field">
          <label htmlFor="profile-phone">Telefon</label>
          <input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            placeholder="0601234567"
          />
        </div>

        {profileError ? <p className="profile-message profile-message--error">{profileError}</p> : null}
        {profileSuccess ? (
          <p className="profile-message profile-message--success">{profileSuccess}</p>
        ) : null}

        <button type="submit" className="profile-button" disabled={savingProfile}>
          {savingProfile ? 'Cuvanje...' : 'Sacuvaj izmene'}
        </button>
      </form>
    </section>
  );
}

export default UserProfilePanel;
