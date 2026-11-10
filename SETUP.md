# DigiTuck handover — start here

This archive contains the complete application source, pinned dependency lockfile, MySQL SQL schema, migrations, tests and configuration examples. It does not contain node_modules, local secrets, real user data, private uploads, database binaries, build output or Git history.

## 1. Install prerequisites

Install Node.js 24 LTS (project pin: 24.22.2), npm 11.18.0 and MySQL Community 8.4. Docker Desktop is optional; a MySQL Compose configuration is provided in infra/compose.yaml.

Extract the ZIP, open a terminal in digituck-vendor, and run:

```powershell
npm ci
Copy-Item .env.example .env
```

Edit .env: set your MySQL user/password/database, DATABASE_URL, MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD and a new random SESSION_SECRET. Generate a secret using `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Do not reuse placeholder values. URL-encode special characters in DATABASE_URL passwords. Keep .env private.

Defaults: frontend http://127.0.0.1:5175, API 4005, MySQL 3307. APP_ORIGIN must exactly match the frontend URL. For a native MySQL installation on 3306, change the port in DATABASE_URL.

## 2. Create the database (choose ONE route)

### Route A — migrations (recommended)

For Docker, run `npm run db:up`. For native MySQL, create an empty database named digituck with utf8mb4 and grant your application/migration user access. The migration user needs table/index/trigger privileges. Binary-logged servers may require the operator to enable log_bin_trust_function_creators for trigger creation.

```powershell
npm run db:migrate
npm run db:check
```

### Route B — included SQL

Create an EMPTY MySQL8.4 database, then open the mysql client using your own credentials (password is prompted):

```text
mysql --host=127.0.0.1 --port=3307 --user=YOUR_DB_USER --password digituck
```

At the mysql prompt, run (replace with your extracted absolute path, using forward slashes):

```sql
SOURCE C:/path/to/digituck-vendor/database-sql/digituck.sql;
```

The SQL includes tables, constraints, indexes, history/snapshot triggers, default categories and migration metadata. It contains no real users/password hashes/sessions/orders/documents. It has no hard-coded database name or DEFINER account, and must be imported only into an empty database. Configure DATABASE_URL for that database, then run `npm run db:check`. Do not import the SQL after migrations have created the same tables.

## 3. Start the application

```powershell
npm run dev
```

Open http://127.0.0.1:5175. Keep the terminal running. Stop with Ctrl+C.

The original vendor menu is Dashboard, Products, Orders, Store Profile and Settings. Inventory is accessible within Products. Sign out is in vendor Settings. Login and registration are connected to real server-side sessions. Guests can browse and edit a cart; checkout requires login. Orders are collection-only with payment at collection.

## 4. Create your own accounts

Register customer/vendor accounts through the UI. To create the first admin, temporarily set these PowerShell environment variables with your own values:

```powershell
$env:ADMIN_FULL_NAME = 'Your administrator name'
$env:ADMIN_EMAIL = 'your-admin@example.com'
$env:ADMIN_PHONE = '+27821234567'
$env:ADMIN_PASSWORD = 'choose-your-own-long-unique-password'
npm run admin:bootstrap
Remove-Item Env:ADMIN_PASSWORD
```

Use a password of at least12 characters (max72 UTF-8 bytes). There are no built-in credentials. Vendors save their business profile and opening hours, upload the configured development proof document and submit for admin approval. Products only become public after approval. A shop must be approved, unpaused and within its opening hours for checkout.

## 5. Verify changes

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

For integration/browser tests configure TEST_DATABASE_URL for a separate disposable database ending _test; set ALLOW_DB_TEST_RESET=true for the test shell. `npm run test:db` and `npm run test:e2e` reset that test database. Never run them against business data or concurrently with each other.

## Notes for handover

Source and test evidence: docs/implementation-status.md. API details: docs/api. No production deployment is included. Production startup requires HTTPS origin and private S3 storage configuration; running `npm start` with the example development environment is intentionally rejected. Email recovery, external notifications, prepared-food partial restock and some later-phase moderation/reporting features remain documented limitations.

The historical README/runbook references the original developer's workstation. Those paths are historical only: a recipient should follow this SETUP.md and use their own installed Node/MySQL and configuration.
