# `examples/` — frontend integration reference

> **These files are EXAMPLES.** They show how to talk to the PHP backend (auth, sessions, admin-gated endpoints) from React. Copy them into your real feature folders, rename, restyle, and adapt — don't ship them as-is. They use inline styles and zero design polish on purpose, so there's nothing to fight when you replace them with your real UI.

The backend they target is documented in `backend/README.md` at the project root.

---

## What's in the folder

| File                | What it is                                       | When you'll use it                                   |
|---------------------|--------------------------------------------------|------------------------------------------------------|
| `types.ts`          | `User`, `Role`, `RegisterPayload` TypeScript types | Always — keep these in sync with backend responses |
| `api.ts`            | Tiny `fetch` wrapper (`api.get`, `api.post`)     | Every API call goes through this                     |
| `AuthContext.tsx`   | `<AuthProvider>` + `useAuth()` hook              | Wrap your root once; call the hook anywhere          |
| `LoginForm.tsx`     | Email/password login form                        | Drop in wherever a login UI lives                    |
| `RegisterForm.tsx`  | Self-signup form                                 | Drop in on your signup page                          |
| `LogoutButton.tsx`  | One-line logout button                           | In a navbar / user menu                              |
| `RequireAuth.tsx`   | Renders children only if logged in               | Around protected pages/sections                      |
| `RequireAdmin.tsx`  | Renders children only if logged in as admin      | Around admin-only pages/sections                     |
| `UsersList.tsx`     | Calls `GET /api/users` and renders the list      | Inside a `<RequireAdmin>` somewhere                  |
| `ExampleApp.tsx`    | Top-level demo wiring all of the above together  | Reference for how the pieces connect                 |

Dependency graph:

```
ExampleApp ──► AuthProvider ──► useAuth ──► api ──► fetch
   │
   ├─► LoginForm ─────► useAuth
   ├─► RegisterForm ──► useAuth
   ├─► LogoutButton ──► useAuth
   └─► RequireAdmin ──► useAuth
          │
          └─► UsersList ──► api
```

---

## The two things to understand

### 1. `credentials: 'include'` is mandatory

The backend uses PHP `$_SESSION`. The session ID lives in a cookie called `PHPSESSID`. Browsers do **not** send cookies on cross-origin XHR by default — you have to opt in.

That's why every fetch in `api.ts` uses `credentials: 'include'`. If you write a new fetch call that bypasses `api.ts`, **you must remember this**, or the backend will look anonymous to your request.

The matching server-side piece is in `backend/config/cors.php`: `Access-Control-Allow-Credentials: true` and a literal origin (`http://localhost:3000`, not `*`).

### 2. `AuthProvider` rehydrates on mount

When the app loads, `AuthProvider` immediately calls `GET /api/auth/me`. Three outcomes:
- **2xx** → user is set; UI shows logged-in state without ever showing the login form.
- **401** → user stays null; UI shows the login form.
- **anything else** → thrown; render an error boundary.

This is why a returning user doesn't re-enter their password on every page reload — the cookie is still valid, `/api/auth/me` returns their record, and the app picks up where it was.

---

## How to wire it into a real app

### Minimal mount

```tsx
import { AuthProvider } from './examples/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
```

### Reading the user anywhere

```tsx
import { useAuth } from './examples/AuthContext';

function NavBar() {
  const { user, logout } = useAuth();
  if (!user) return <a href="/login">Log in</a>;
  return (
    <>
      <span>Hi, {user.first_name}</span>
      <button onClick={logout}>Log out</button>
    </>
  );
}
```

### Gating a page

```tsx
<RequireAuth fallback={<Navigate to="/login" />}>
  <Dashboard />
</RequireAuth>

<RequireAdmin>
  <AdminConsole />
</RequireAdmin>
```

### Calling a new endpoint

Always go through `api.ts`. Don't reinvent the credentials-include dance:

```ts
import { api } from './examples/api';

const recipes = await api.get<Recipe[]>('/api/recipes');
await api.post('/api/recipes', { name: 'Kajgana', description: '...' });
```

Errors throw `ApiError` with `.status` and `.message` — catch and display.

---

## Login flow walkthrough (what happens on submit)

1. `<LoginForm>` calls `login(email, password)` from `useAuth()`.
2. `useAuth().login` calls `api.post('/api/auth/login', { email, password })`.
3. `api.ts` adds `credentials: 'include'` and `Content-Type: application/json`.
4. PHP validates the password, runs `session_regenerate_id(true)`, sets `$_SESSION['user_id']`, replies with the user JSON and a `Set-Cookie: PHPSESSID=…` header.
5. Browser stores the cookie. `AuthProvider` updates its `user` state. UI re-renders.
6. Subsequent calls (`/api/auth/me`, `/api/users`, …) auto-attach the cookie. Backend reads `$_SESSION['user_id']` and identifies you.

Logout reverses step 4: PHP destroys the session and sends an expired cookie. The next `/api/auth/me` call would 401 — but `AuthProvider` proactively clears `user` so you don't have to wait for that round trip.

---

## Common pitfalls

- **CORS error in console** — backend origin doesn't match. Backend currently allows `http://localhost:3000` only. If you serve the frontend from a different port, update `backend/config/cors.php`.
- **Session "vanishes" between requests** — you forgot `credentials: 'include'` somewhere, or you're hitting a different host (`localhost` vs `127.0.0.1` are different cookie domains).
- **`/api/users` returns 403** — you're logged in as a regular user, not an admin. Use `admin1@mojfrizider.rs` / `password123` for the seeded admin.
- **TypeScript complains about `User['role_name']`** — types in `types.ts` must match what the backend actually returns. Update both sides together.

---

## Things these examples deliberately don't do

- **No router.** A real app uses `react-router` (or similar). Wrap routes with `<RequireAuth>` / `<RequireAdmin>`; pass a `fallback` that navigates to `/login`.
- **No global error toast.** Forms catch their own errors. Decide on a UX (inline / toast / modal).
- **No styling system.** Inline styles only.
- **No password-strength UI.** Backend enforces 6-char minimum; frontend just sets `minLength={6}`.
- **No "remember me" / persistent vs session cookies.** Backend currently uses session cookies (cleared on browser close). If you want long-lived sessions, increase `lifetime` in `backend/config/auth.php`.
- **No password reset, no email verification.** Backend doesn't ship those; out of scope.

When you replace these with real components, keep `api.ts` and `AuthContext.tsx` mostly as-is — those are the parts that benefit from being centralised. Forms and gates are throwaway.
