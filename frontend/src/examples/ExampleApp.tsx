import { AuthProvider, useAuth } from './AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { LogoutButton } from './LogoutButton';
import { UsersList } from './UsersList';
import { RequireAdmin } from './RequireAdmin';

// End-to-end demo of the auth flow.
// - <AuthProvider> wraps the whole tree (do this once, near the root).
// - useAuth() reads the session anywhere below it.
// - <RequireAdmin> guards the user-management section.

function Inner() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading session…</div>;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Frizider — auth example</h1>

      {user ? (
        <section>
          <p>
            Logged in as <strong>{user.email}</strong> ({user.role_name})
          </p>
          <LogoutButton />
        </section>
      ) : (
        <section style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <h2>Log in</h2>
            <LoginForm />
            <p style={{ fontSize: 12, opacity: 0.7 }}>
              Try: <code>admin1@mojfrizider.rs</code> / <code>password123</code>
            </p>
          </div>
          <div>
            <h2>Or register</h2>
            <RegisterForm />
          </div>
        </section>
      )}

      <hr style={{ margin: '24px 0' }} />

      <section>
        <h2>Users (admin-only)</h2>
        <RequireAdmin fallback={<p>Log in as an admin to see the user list.</p>}>
          <UsersList />
        </RequireAdmin>
      </section>
    </div>
  );
}

export default function ExampleApp() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  );
}
