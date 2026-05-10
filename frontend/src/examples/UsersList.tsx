import { useEffect, useState } from 'react';
import { api } from './api';
import { User } from './types';

// Lists every user. The endpoint is admin-only on the backend, so wrap this
// component with <RequireAdmin> when you mount it — otherwise non-admin users
// will see "admin role required" pop out as the error message here.

export function UsersList() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<User[]>('/api/users')
      .then(setUsers)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div>Failed to load users: {error}</div>;
  if (users === null) return <div>Loading users…</div>;
  if (users.length === 0) return <div>No users yet.</div>;

  return (
    <div>
      <h3>Users ({users.length})</h3>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            <strong>
              {u.first_name} {u.last_name}
            </strong>{' '}
            — {u.email}
            {u.role_name === 'admin' && ' (admin)'}
          </li>
        ))}
      </ul>
    </div>
  );
}
