export type Role = 'admin' | 'user';

export type User = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role_id: number;
  role_name: Role;
  is_active: boolean;
};
