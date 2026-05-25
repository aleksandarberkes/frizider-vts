import { ApiError } from '../../../api';

export const mapAdminError = (err: unknown, fallback: string) => {
  if (err instanceof TypeError) {
    return 'Backend nije dostupan na http://localhost/frizider-vts/backend.';
  }
  if (err instanceof ApiError || err instanceof Error) {
    return err.message;
  }
  return fallback;
};
