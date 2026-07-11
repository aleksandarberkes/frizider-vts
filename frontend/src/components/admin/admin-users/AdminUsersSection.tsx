import EmptyState from '../../feedback/EmptyState';
import LoadingState from '../../feedback/LoadingState';
import { User } from '../../../auth/types';

type AdminUsersSectionProps = {
  users: User[];
  loading: boolean;
  userBusyId: number | null;
  currentUserId?: number;
  onToggleActive: (user: User) => void;
  onChangeRole: (user: User, roleId: number) => void;
  onDelete: (userId: number) => void;
};

function AdminUsersSection({
  users,
  loading,
  userBusyId,
  currentUserId,
  onToggleActive,
  onChangeRole,
  onDelete,
}: AdminUsersSectionProps) {
  const handleDelete = (user: User) => {
    if (window.confirm(`Obrisati korisnika ${user.email}?`)) {
      onDelete(user.id);
    }
  };

  return (
    <article className="admin-dashboard-card">
      <div className="admin-dashboard-card-head">
        <div>
          <h2>Korisnici</h2>
          <p>Pregled naloga, blokiranje/odblokiranje i upravljanje ulogama.</p>
        </div>
      </div>

      {loading ? (
        <LoadingState className="admin-dashboard-empty" message="Ucitavanje korisnika..." />
      ) : users.length === 0 ? (
        <EmptyState className="admin-dashboard-empty" message="Nema korisnika." />
      ) : (
        <table className="admin-dashboard-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Ime</th>
              <th>Uloga</th>
              <th>Status</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const busy = userBusyId === user.id;
              return (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>
                    {`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || '-'}
                  </td>
                  <td>
                    <select
                      value={user.role_id}
                      disabled={busy || isSelf}
                      onChange={(event) => onChangeRole(user, Number(event.target.value))}
                    >
                      <option value={1}>admin</option>
                      <option value={2}>user</option>
                    </select>
                  </td>
                  <td>
                    <span
                      className={
                        user.is_active
                          ? 'admin-dashboard-status admin-dashboard-status-approved'
                          : 'admin-dashboard-status admin-dashboard-status-pending'
                      }
                    >
                      {user.is_active ? 'Aktivan' : 'Blokiran'}
                    </span>
                  </td>
                  <td className="admin-dashboard-row-actions">
                    <button
                      type="button"
                      className={user.is_active ? 'admin-dashboard-secondary' : 'admin-dashboard-approve'}
                      onClick={() => onToggleActive(user)}
                      disabled={busy || isSelf}
                    >
                      {user.is_active ? 'Blokiraj' : 'Odblokiraj'}
                    </button>
                    <button
                      type="button"
                      className="admin-dashboard-danger"
                      onClick={() => handleDelete(user)}
                      disabled={busy || isSelf}
                    >
                      {busy ? 'Radim...' : 'Obrisi'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </article>
  );
}

export default AdminUsersSection;
