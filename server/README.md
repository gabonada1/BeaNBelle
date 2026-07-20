# Backend

This folder contains the backend API for the Bea N Belle store system.

## Scripts

```bash
npm run dev
npm start
npm run db:seed
```

`npm run db:seed` resets the app collections and creates starter branches, products, a sample employee, and a default owner.
Change the seed owner in `server/.env`:

```env
SEED_OWNER_NAME=Bea N Belle Owner
SEED_OWNER_USERNAME=owner
SEED_OWNER_PASSWORD=owner123
```

## Environment

Copy `server/.env.example` to `server/.env` when setting up another machine.

```env
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

If `MONGODB_DB_NAME` is omitted, the backend now uses the database name from `MONGODB_URI`.
Set `MONGODB_DB_NAME` only when you want to override that database explicitly.

## Current Routes

- `GET /api/health`
- `GET /api/config`
- `POST /api/auth/bootstrap-owner`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/branches`
- `POST /api/branches` owner only
- `PATCH /api/branches/:id` owner only
- `GET /api/users` owner only
- `POST /api/users` owner only
- `PATCH /api/users/:id` owner only
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id`
- `GET /api/stock-movements`
- `POST /api/stock-movements`
- `GET /api/sales`
- `POST /api/sales`
- `GET /api/refunds`
- `POST /api/refunds`
- `GET /api/reports/summary?branchId=all`

Owner/user routes use this header after login:

```http
Authorization: Bearer YOUR_LOGIN_TOKEN
```

Create the first owner only once:

```json
POST /api/auth/bootstrap-owner
{
  "name": "Owner Name",
  "username": "owner",
  "password": "password123"
}
```

Add a branch as owner:

```json
POST /api/branches
{
  "name": "New Branch",
  "location": "City Center",
  "manager": "Manager Name"
}
```

Add a user and assign a branch as owner:

```json
POST /api/users
{
  "name": "Staff Name",
  "username": "staff1",
  "password": "password123",
  "role": "employee",
  "branchId": "main"
}
```

Suggested next structure:

- `src/config` for database connection and environment setup
- `src/models` for MongoDB schemas such as `User`, `Branch`, `Product`, `Sale`, and `StockMovement`
- `src/routes` for API endpoints
- `src/controllers` for request handlers
- `src/middleware` for authentication and branch access checks
