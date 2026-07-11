import { useCallback, useEffect, useState } from 'react';
import { User } from '../../../auth/types';
import { usersApi } from '../../../services/usersApi';
import { mapAdminError } from './mapAdminError';

function useAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userBusyId, setUserBusyId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);

    try {
      const usersResponse = await usersApi.adminList();
      setUsers(usersResponse);
      setUsersError(null);
    } catch (err) {
      setUsersError(mapAdminError(err, 'Ucitavanje korisnika nije uspelo.'));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // Block / unblock = flip is_active. The backend PUT needs the whole record.
  const toggleActive = useCallback(async (user: User) => {
    setUserBusyId(user.id);
    setUsersError(null);

    try {
      const updated = await usersApi.adminUpdate(user.id, {
        email: user.email,
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        phone: user.phone ?? null,
        role_id: user.role_id,
        is_active: !user.is_active,
      });
      setUsers((current) => current.map((entry) => (entry.id === user.id ? updated : entry)));
    } catch (err) {
      setUsersError(mapAdminError(err, 'Izmena statusa korisnika nije uspela.'));
    } finally {
      setUserBusyId(null);
    }
  }, []);

  const changeRole = useCallback(async (user: User, roleId: number) => {
    setUserBusyId(user.id);
    setUsersError(null);

    try {
      const updated = await usersApi.adminUpdate(user.id, {
        email: user.email,
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        phone: user.phone ?? null,
        role_id: roleId,
        is_active: user.is_active,
      });
      setUsers((current) => current.map((entry) => (entry.id === user.id ? updated : entry)));
    } catch (err) {
      setUsersError(mapAdminError(err, 'Izmena role korisnika nije uspela.'));
    } finally {
      setUserBusyId(null);
    }
  }, []);

  const deleteUser = useCallback(async (userId: number) => {
    setUserBusyId(userId);
    setUsersError(null);

    try {
      await usersApi.adminDelete(userId);
      setUsers((current) => current.filter((entry) => entry.id !== userId));
    } catch (err) {
      setUsersError(mapAdminError(err, 'Brisanje korisnika nije uspelo.'));
    } finally {
      setUserBusyId(null);
    }
  }, []);

  return {
    users,
    loadingUsers,
    usersError,
    userBusyId,
    loadUsers,
    toggleActive,
    changeRole,
    deleteUser,
  };
}

export default useAdminUsers;
