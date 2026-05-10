# Backend API

A small PHP backend served from XAMPP. Routing is a single front controller (`index.php` + `.htaccess` rewrite). Authentication is PHP native sessions (`$_SESSION`) backed by an HttpOnly cookie. MySQL access via PDO.

---

## Setup

Assumes XAMPP at `/Applications/XAMPP/xamppfiles/`, served at `http://localhost/frizider-vts/backend/`.

1. **Create the database and schema** (one time):
   ```bash
   /Applications/XAMPP/xamppfiles/bin/mysql -uroot < backend/db/run.sql
   ```
   Creates a database `fridge` and seeds 7 users + ingredients + recipes.

2. **Set seeded users' passwords** (one time):
   ```bash
   /Applications/XAMPP/xamppfiles/bin/php backend/db/seed_passwords.php
   ```
   After this, every seeded user has the password `password123`. Pass an alternative as the first argument to use a different one.

3. **Connection settings** live in `backend/config/database.php` (`DB_NAME = 'fridge'`, root/no-password — XAMPP defaults).

Base URL for everything below:
```
http://localhost/frizider-vts/backend
```

---

## How auth works (in 60 seconds)

- `POST /api/auth/login` verifies the password with `password_verify`, regenerates the session ID, and stores `$_SESSION['user_id']`. PHP sets a `PHPSESSID` cookie automatically.
- The cookie is `HttpOnly` and `SameSite=Lax`. It's not `Secure` because dev is HTTP — flip that on for production.
- Every protected endpoint calls `requireUser()` or `requireAdmin()` from `backend/config/auth.php`, which reads the cookie, looks up the user, and either returns the row or short-circuits with `401` / `403`.
- `POST /api/auth/logout` clears `$_SESSION` and expires the cookie.

For a **browser SPA on `http://localhost:3000`**, every fetch must include `credentials: 'include'`:
```ts
fetch(`${BASE}/api/auth/me`, { credentials: 'include' });
```

For **`curl`**, use a cookie jar:
```bash
curl -c jar.txt -b jar.txt ...
```

---

## Authorization model

There are two roles, stored in the `roles` table: `admin` (`role_id = 1`) and `user` (`role_id = 2`). Authorization is done via two helpers in `backend/config/auth.php`:

```php
require_once __DIR__ . '/../config/auth.php';
$user = requireUser();   // 401 if anonymous
$user = requireAdmin();  // 401 if anonymous, 403 if not admin
```

For mixed-access endpoints (e.g. "owner or admin"), call `requireUser()` and branch on `$user['role_name']` and ownership of the row.

### The "don't-forge" invariant

For tables that have a `user_id` column belonging to the caller (`comments`, `favorites`, `ratings`, `user_fridge`), the backend **always reads `user_id` from `$_SESSION['user_id']` and ignores any `user_id` in the request body**. Verified end-to-end with curl: passing `user_id: 1` in the body still produces a row with the caller's actual ID.

---

## Access matrix

Every CRUD endpoint, summarised. **public** = no login required. **user** = any logged-in user. **own** = the caller's own row(s). **owner** = the row's owner field (e.g. `recipes.created_by`). **admin** = role_name = `'admin'`.

| Resource              | List              | Read one         | Create                 | Update                                | Delete                  |
|-----------------------|-------------------|------------------|------------------------|---------------------------------------|-------------------------|
| `roles`               | public            | public           | —                      | —                                     | —                       |
| `users`               | admin             | admin / self     | public (`/auth/register`) **or** admin (`/users`) | self (own profile) **or** admin       | self **or** admin       |
| `ingredients`         | public            | public           | user                   | admin                                 | admin                   |
| `categories`          | public            | public           | admin                  | admin                                 | admin                   |
| `recipes`             | filtered\*        | filtered\*       | user                   | owner **or** admin                    | owner **or** admin      |
| `recipes.is_approved` | —                 | —                | (server sets to 0)     | **admin only**                        | —                       |
| `user_fridge`         | own (admin: any)  | —                | own                    | —                                     | own                     |
| `favorites`           | own               | —                | own                    | —                                     | own                     |
| `ratings`             | own + public agg. | public agg.      | own (upsert)           | own (upsert via POST)                 | own / admin             |
| `comments`            | filtered\*\*      | —                | user (`user_id` forced)| author (content) / admin (also approval) | author or admin       |

\* **Recipe visibility:** anonymous and non-admin users see only `is_approved = 1`; the recipe's author additionally sees their own pending recipes; admins see everything.
\*\* **Comment visibility:** same rule — approved + own + admin.

---

## Endpoints

All requests/responses are JSON. Errors look like `{ "error": "human-readable message" }`.

### Auth

| Method | Path                  | Auth      | Body                                                              |
|--------|-----------------------|-----------|-------------------------------------------------------------------|
| POST   | `/api/auth/register`  | public    | `email, password, first_name, last_name, phone?`                  |
| POST   | `/api/auth/login`     | public    | `email, password`                                                 |
| POST   | `/api/auth/logout`    | user      | —                                                                 |
| GET    | `/api/auth/me`        | user      | —                                                                 |

### Users

| Method | Path                            | Auth        | Body                                                                          |
|--------|---------------------------------|-------------|-------------------------------------------------------------------------------|
| GET    | `/api/users`                    | admin       | —                                                                             |
| GET    | `/api/users/{id}`               | admin / self | —                                                                            |
| POST   | `/api/users`                    | admin       | `email, password, first_name, last_name, role_id, phone?` (admin can mint admins here) |
| PUT    | `/api/users/me`                 | user (self) | `first_name, last_name, phone?`                                               |
| POST   | `/api/users/me/password`        | user (self) | `current_password, new_password`                                              |
| DELETE | `/api/users/me`                 | user (self) | — (clears caller's session)                                                   |
| PUT    | `/api/users/{id}`               | admin       | `email, first_name, last_name, role_id, is_active, phone?`                    |
| DELETE | `/api/users/{id}`               | admin       | —                                                                             |

User deletion (self or admin) deletes the user's `ratings` and `comments` first, then the user row. **It refuses with `409` if the user has any recipes** — those need to be removed or reassigned manually.

A user **cannot change their own email** through self-service. Only admins can change a user's email (via `PUT /api/users/{id}`).

### Roles

| Method | Path                | Auth   |
|--------|---------------------|--------|
| GET    | `/api/roles`        | public |
| GET    | `/api/roles/{id}`   | public |

### Ingredients

| Method | Path                       | Auth  | Body              |
|--------|----------------------------|-------|-------------------|
| GET    | `/api/ingredients`         | public| —                 |
| GET    | `/api/ingredients/{id}`    | public| —                 |
| POST   | `/api/ingredients`         | user  | `name, unit`      |
| PUT    | `/api/ingredients/{id}`    | admin | `name, unit`      |
| DELETE | `/api/ingredients/{id}`    | admin | —                 |

### Categories

| Method | Path                      | Auth  | Body     |
|--------|---------------------------|-------|----------|
| GET    | `/api/categories`         | public| —        |
| GET    | `/api/categories/{id}`    | public| —        |
| POST   | `/api/categories`         | admin | `name`   |
| PUT    | `/api/categories/{id}`    | admin | `name`   |
| DELETE | `/api/categories/{id}`    | admin | —        |

### Recipes

| Method | Path                  | Auth                  | Body                                                                                                |
|--------|-----------------------|-----------------------|-----------------------------------------------------------------------------------------------------|
| GET    | `/api/recipes`        | public (filtered)     | —                                                                                                   |
| GET    | `/api/recipes/{id}`   | public (filtered)     | —                                                                                                   |
| POST   | `/api/recipes`        | user                  | `name, description?, image_path?, estimated_price?, ingredients?, categories?` (created with `is_approved = 0`) |
| PUT    | `/api/recipes/{id}`   | owner / admin         | same as POST + admin-only `is_approved`                                                              |
| DELETE | `/api/recipes/{id}`   | owner / admin         | —                                                                                                   |

The recipe payload includes its joins inline:
```jsonc
{
  "name": "Kajgana sa sirom",
  "description": "Brza kajgana...",
  "image_path": "kajgana.jpg",
  "estimated_price": 250.00,
  "ingredients": [
    { "ingredient_id": 1,  "quantity": 3 },
    { "ingredient_id": 15, "quantity": 50 }
  ],
  "categories": [1]
}
```
On `PUT`, the existing `recipe_ingredients` and `recipe_categories` rows for this recipe are replaced wholesale with the payload's lists — so you must always send the full list, not a delta.

Owners cannot change `is_approved`. If an owner sends `"is_approved": true`, the field is ignored (the existing value is preserved). Only admins can flip it.

### User fridge

| Method | Path                         | Auth                              | Body                |
|--------|------------------------------|-----------------------------------|---------------------|
| GET    | `/api/fridge`                | user (admin can pass `?user_id=N`)| —                   |
| POST   | `/api/fridge`                | user                              | `ingredient_id`     |
| DELETE | `/api/fridge/{ingredient_id}`| user (own only)                   | —                   |

### Favorites

| Method | Path                         | Auth        | Body          |
|--------|------------------------------|-------------|---------------|
| GET    | `/api/favorites`             | user        | —             |
| POST   | `/api/favorites`             | user        | `recipe_id`   |
| DELETE | `/api/favorites/{recipe_id}` | user (own)  | —             |

Listing only includes recipes the caller is allowed to see (approved + own pending; admin sees all).

### Ratings

| Method | Path                         | Auth                            | Body                       |
|--------|------------------------------|----------------------------------|----------------------------|
| GET    | `/api/ratings`               | user                            | — (caller's own ratings)   |
| GET    | `/api/ratings/recipe/{id}`   | public                          | — (returns `{average, count}`) |
| POST   | `/api/ratings`               | user (upsert)                   | `recipe_id, rating (1-5)`  |
| DELETE | `/api/ratings/{recipe_id}`   | user (own; admin: `?user_id=N`) | —                          |

Posting twice with the same `recipe_id` replaces the previous rating (`ON DUPLICATE KEY UPDATE`).

### Comments

| Method | Path                          | Auth                                            | Body                       |
|--------|-------------------------------|--------------------------------------------------|----------------------------|
| GET    | `/api/comments?recipe_id=N`   | public (filtered: approved + own + admin)        | —                          |
| POST   | `/api/comments`               | user (`user_id` always forced from session)      | `recipe_id, content`       |
| PUT    | `/api/comments/{id}`          | author (content only) / admin (content + approval) | `content?, is_approved?` |
| DELETE | `/api/comments/{id}`          | author or admin                                  | —                          |

**A user can only post comments as themselves.** Even if the request body sets `user_id`, it's ignored — the backend always uses `$_SESSION['user_id']`.

Authors can edit their own comment's `content`. Only admins can flip `is_approved`. New comments start with `is_approved = 0` and are invisible to other users until an admin approves them.

---

## Status codes

| Code    | When                                                       |
|---------|------------------------------------------------------------|
| 200     | Success                                                    |
| 201     | Resource created                                           |
| 204     | CORS preflight                                             |
| 400/422 | Missing or invalid input fields                            |
| 401     | Not logged in (or login attempt with wrong credentials)    |
| 403     | Logged in but not allowed (e.g. non-admin hitting an admin endpoint) |
| 404     | Unknown route or resource hidden by visibility rules       |
| 405     | Wrong HTTP method for the route                            |
| 409     | Conflict (duplicate email/name, or FK constraint blocking deletion) |
| 500     | Unhandled server error — check `xamppfiles/logs/php_error_log` |

---

## File layout

```
backend/
  index.php              # Front controller — splits URL, dispatches to api/*.php
  .htaccess              # Rewrites everything to index.php
  config/
    cors.php             # CORS headers + OPTIONS handling
    database.php         # PDO connection (DB_NAME = 'fridge')
    auth.php             # startSession, currentUser, requireUser, requireAdmin
    util.php             # respondJson, respondError, readJsonBody, intSegment
  api/
    auth.php             # /api/auth/{register,login,logout,me}
    users.php            # /api/users (and /me, /me/password, /{id})
    roles.php            # /api/roles (read-only)
    ingredients.php      # /api/ingredients
    categories.php       # /api/categories
    recipes.php          # /api/recipes (with nested ingredients/categories)
    fridge.php           # /api/fridge
    favorites.php        # /api/favorites
    ratings.php          # /api/ratings (own + aggregate + upsert)
    comments.php         # /api/comments (with approval gate)
  db/
    run.sql              # Schema + seed data
    seed_passwords.php   # One-shot: rewrite seeded users' password_hash
    export.sql           # phpMyAdmin export (older dump)
    dbschema.png         # Schema diagram
```

---

## Worked examples

### Public browsing (no login)

```bash
curl http://localhost/frizider-vts/backend/api/recipes
curl http://localhost/frizider-vts/backend/api/recipes/1
curl http://localhost/frizider-vts/backend/api/categories
curl http://localhost/frizider-vts/backend/api/ingredients
curl 'http://localhost/frizider-vts/backend/api/comments?recipe_id=1'
curl http://localhost/frizider-vts/backend/api/ratings/recipe/1
```

### Logged-in user lifecycle

```bash
JAR=/tmp/u.jar; rm -f $JAR
BASE=http://localhost/frizider-vts/backend

# log in
curl -c $JAR -b $JAR -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"pera@gmail.com","password":"password123"}'

# create my own recipe
curl -c $JAR -b $JAR -X POST $BASE/api/recipes -H 'Content-Type: application/json' -d '{
  "name":"Moja kajgana",
  "description":"...",
  "estimated_price":250,
  "ingredients":[{"ingredient_id":1,"quantity":2},{"ingredient_id":15,"quantity":50}],
  "categories":[1]
}'

# add to fridge / favorites / rate / comment
curl -c $JAR -b $JAR -X POST $BASE/api/fridge    -H 'Content-Type: application/json' -d '{"ingredient_id":11}'
curl -c $JAR -b $JAR -X POST $BASE/api/favorites -H 'Content-Type: application/json' -d '{"recipe_id":2}'
curl -c $JAR -b $JAR -X POST $BASE/api/ratings   -H 'Content-Type: application/json' -d '{"recipe_id":2,"rating":5}'
curl -c $JAR -b $JAR -X POST $BASE/api/comments  -H 'Content-Type: application/json' -d '{"recipe_id":2,"content":"Odlično!"}'

# update my profile
curl -c $JAR -b $JAR -X PUT $BASE/api/users/me -H 'Content-Type: application/json' \
  -d '{"first_name":"Petar","last_name":"Petrović","phone":"0633333333"}'

# log out
curl -c $JAR -b $JAR -X POST $BASE/api/auth/logout
```

### Admin moderation

```bash
JAR=/tmp/a.jar; rm -f $JAR
BASE=http://localhost/frizider-vts/backend

curl -c $JAR -b $JAR -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin1@mojfrizider.rs","password":"password123"}'

# list everyone's pending recipes (admin sees all; non-admin only sees approved)
curl -c $JAR -b $JAR $BASE/api/recipes

# approve a recipe (only admin can flip this flag)
curl -c $JAR -b $JAR -X PUT $BASE/api/recipes/4 -H 'Content-Type: application/json' -d '{
  "name":"Recipe name (still required on PUT)",
  "is_approved":true,
  "ingredients":[{"ingredient_id":1,"quantity":3}],
  "categories":[1]
}'

# approve a comment
curl -c $JAR -b $JAR -X PUT $BASE/api/comments/4 -H 'Content-Type: application/json' \
  -d '{"is_approved":true}'

# create a new admin
curl -c $JAR -b $JAR -X POST $BASE/api/users -H 'Content-Type: application/json' -d '{
  "email":"admin3@mojfrizider.rs",
  "password":"hunter2",
  "first_name":"Third","last_name":"Admin",
  "role_id":1
}'

# manage catalog: only admins can edit/delete ingredients & categories;
# any logged-in user can ADD an ingredient.
curl -c $JAR -b $JAR -X POST $BASE/api/categories -H 'Content-Type: application/json' \
  -d '{"name":"Užina"}'
```

---

## Production checklist (when you eventually deploy)

These don't matter on `localhost`, but flip them before going live:

- Serve over HTTPS and set `secure: true` in `session_set_cookie_params` (`backend/config/auth.php`).
- If frontend and backend are on different sites (not just different ports of `localhost`), set `samesite: 'None'` — but that **requires** `secure: true`.
- Update `backend/config/cors.php` to your real frontend origin instead of `http://localhost:3000`.
- Move DB credentials out of `database.php` into environment variables.
- Add rate limiting on `/api/auth/login` (e.g. fail2ban, or a counter table).
- Consider DB-backed sessions (`session.save_handler = user`) if you scale to multiple PHP servers.

---

## Adding a new endpoint

The router (`index.php`) maps `/api/{resource}` to `backend/api/{resource}.php`. Inside the route file you have these variables in scope: `$method` (`GET`/`POST`/...), `$segments` (e.g. `['api','recipes','4']`), and you can `require_once` the helpers.

A minimal protected endpoint looks like:

```php
<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';

$id = intSegment($segments, 2);  // /api/myresource/{id}

if ($method === 'GET') {
    requireUser();    // or requireAdmin() or skip for public
    $pdo = getConnection();
    // ...
    respondJson(200, $data);
}

respondError(405, 'method not allowed');
```
