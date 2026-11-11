# DigiTuck

DigiTuck is an online tuckshop ordering system that helps customers find participating tuckshops, browse available products, place collection orders, and track order status. Shop owners can manage their store information, products, stock, and incoming orders, while administrators review and manage shop accounts.

The project is built as a web application with a React frontend, an Express API, and a MySQL database. 

Link to the webbase application:sakhimhlongo-foundation.org.za

## Table of Contents

- [Project Overview](#project-overview)
- [Main Features](#main-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation and Setup](#installation-and-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Creating User Accounts](#creating-user-accounts)
- [Testing](#testing)
- [Order Process](#order-process)
- [Security](#security)
- [Current Scope and Limitations](#current-scope-and-limitations)
- [Documentation](#documentation)

## Project Overview

Traditional tuckshop ordering can involve queues, handwritten notes and orders being placed through phone calls or messaging applications. DigiTuck provides a central online platform where customers can view participating shops and their products before placing an order.

The system has three main user roles:

| User role | Responsibilities |
|---|---|
| Customer | Browse shops and products, manage a cart, place collection orders and view order history. |
| Vendor | Manage shop details, opening hours, products, stock and customer orders. |
| Administrator | Review vendor applications, approve or reject shops, manage account statuses and oversee platform activity. |

Orders in the current implementation are for collection, with payment made when the customer collects the order.

## Main Features

### Customer
- Register and sign in to a customer account.
- Browse approved and available tuckshops.
- View shop details, opening hours and product catalogues.
- Add products to a cart, update quantities and remove items.
- Continue browsing as a guest and sign in when proceeding to checkout.
- Place collection orders.
- View order history and order details.
- Manage account details and password.

### Vendor
- Register a vendor account and submit shop information for review.
- Maintain a business profile and weekly opening hours.
- Pause or resume a shop.
- Add, edit, hide and archive products.
- Manage product categories, prices and stock quantities.
- Set low-stock thresholds and record stock adjustments.
- View and process incoming orders.
- Update order progress through the available collection workflow.
- Manage account settings.

### Administrator
- Review vendor applications and submitted business documents.
- Approve, reject or suspend shops, with reasons recorded.
- Review current and previous vendor submissions.
- Manage user account statuses.
- Access administrative audit history.

### Ordering and Inventory
- Server-side cart and checkout validation.
- Orders are linked to the selected shop.
- Stock is reserved when an order is successfully placed.
- Order details retain product and price information from the time of purchase.
- Database transactions help protect stock and order records during concurrent activity.
- Pending orders can expire after the configured time limit.

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | React, Vite, JavaScript and TypeScript |
| Backend | Node.js, Express and TypeScript |
| Database | MySQL 8.4 |
| Database access | Knex and mysql2 |
| Shared validation and contracts | Zod and the `@digituck/contracts` workspace package |
| Styling and UI | CSS, Bootstrap and Lucide icons |
| Testing | Vitest, Supertest and Playwright |
| Development tools | npm workspaces, ESLint and Docker Compose |

## Project Structure

```text
digituck-vendor/
├── apps/
│   └── api/                  # Express API and backend modules
├── database-sql/
│   └── digituck.sql          # Full database SQL script
├── db/
│   ├── migrations/           # Database migrations
│   └── seeds/                # Optional development seed data
├── docs/
│   ├── api/                  # API documentation
│   ├── decisions/            # Technical decision records
│   ├── runbooks/             # Operational instructions
│   └── specification/        # System blueprint and design documents
├── infra/
│   └── compose.yaml          # MySQL Docker Compose configuration
├── packages/
│   └── contracts/            # Shared application contracts
├── public/                   # Public static assets
├── scripts/                  # Database, admin and maintenance scripts
├── src/
│   ├── components/           # Reusable frontend components
│   ├── lib/                  # Frontend utilities and API integration
│   └── pages/                # Application pages
├── tests/
│   ├── e2e/                  # Browser end-to-end tests
│   └── integration/          # Integration tests
├── .env.example              # Environment variable template
├── package.json
├── package-lock.json
└── README.md
```

## Requirements

Install the following before setting up the project:

- Node.js 24 LTS (the project was configured with Node.js 24.22.2).
- npm 11.18.0.
- MySQL Community Server 8.4.
- Git, if cloning the repository.
- Docker Desktop is optional. A Docker Compose configuration is included for running MySQL locally.

The project supports Windows and Linux environments with the required software installed.

## Installation and Setup

### 1. Get the project

Clone the repository:

```bash
git clone <repository-url>
cd digituck-vendor
```

Alternatively, download the project ZIP from the repository and extract it.

### 2. Install dependencies

Run the following command from the project root:

```bash
npm ci
```

### 3. Configure environment variables

Create a local environment file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux/macOS:**

```bash
cp .env.example .env
```

Open `.env` and update the database credentials and application settings. At minimum, configure:

```env
NODE_ENV=development
PORT=4005
APP_ORIGIN=http://127.0.0.1:5175

DATABASE_URL=mysql://digituck:YOUR_DB_PASSWORD@127.0.0.1:3307/digituck
MYSQL_DATABASE=digituck
MYSQL_USER=digituck
MYSQL_PASSWORD=YOUR_DB_PASSWORD
MYSQL_ROOT_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD
MYSQL_PORT=3307

SESSION_SECRET=YOUR_RANDOM_SECRET
```

Use your own strong passwords and a randomly generated session secret. If a database password contains special characters, URL-encode it in `DATABASE_URL`. Do not commit `.env` or share its contents.

A random session secret can be generated with:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

The frontend, API and database use these default local ports:

| Service | Default address |
|---|---|
| Frontend | `http://127.0.0.1:5175` |
| API | `http://127.0.0.1:4005` |
| MySQL | `127.0.0.1:3307` |

`APP_ORIGIN` must match the frontend address used by the application.

## Database Setup

Choose **one** of the following methods. Do not run both methods against the same database.

### Option A: Use Docker Compose

Make sure Docker Desktop is running and that the database settings in `.env` are configured.

Start the MySQL service:

```bash
npm run db:up
```

Apply the database migrations:

```bash
npm run db:migrate
```

Check the database:

```bash
npm run db:check
```

To stop the database container:

```bash
npm run db:down
```

### Option B: Use an existing MySQL installation

1. Start MySQL Server.
2. Create an empty database named `digituck` using the `utf8mb4` character set.
3. Configure the database username, password and port in `.env`.
4. Run the migrations:

```bash
npm run db:migrate
npm run db:check
```

The database user must have the permissions required to create tables, indexes and triggers.

### Alternative: Import the supplied SQL file

The project includes a full SQL script at:

```text
database-sql/digituck.sql
```

Import it into a newly created, empty MySQL 8.4 database. For example:

```bash
mysql --host=127.0.0.1 --port=3307 --user=YOUR_DB_USER --password digituck
```

At the MySQL prompt, run the script using its actual location:

```sql
SOURCE C:/path/to/digituck-vendor/database-sql/digituck.sql;
```

After importing, make sure `DATABASE_URL` points to that database and run:

```bash
npm run db:check
```

Do not import the SQL script after running migrations on the same database, as the tables and other database objects may already exist.

## Running the Application

After installing dependencies and configuring the database, start the application from the project root:

```bash
npm run dev
```

Open the frontend in a browser:

**http://127.0.0.1:5175**

Keep the terminal open while using the application. Press `Ctrl+C` to stop the development processes.

## Creating User Accounts

### Customer and vendor accounts

Customer and vendor accounts can be registered through the application.

Vendors must complete their shop information, provide the required business document and submit the application for administrator review. A shop only becomes available to customers after it has been approved and is active.

### First administrator account

There are no default administrator login credentials. Create the first administrator using your own details.

In Windows PowerShell, set the following environment variables temporarily:

```powershell
$env:ADMIN_FULL_NAME = 'Administrator Name'
$env:ADMIN_EMAIL = 'admin@example.com'
$env:ADMIN_PHONE = '+27821234567'
$env:ADMIN_PASSWORD = 'YourStrongUniquePassword'
npm run admin:bootstrap
Remove-Item Env:ADMIN_PASSWORD
```

Use a unique password of at least 12 characters. Do not add administrator credentials to source files or commit them to GitHub.

## Testing

Run the available checks from the project root.

### Code quality

```bash
npm run lint
npm run typecheck
```

### Unit and API tests

```bash
npm test
```

### Database integration tests

Database tests use a separate disposable MySQL database. Configure `TEST_DATABASE_URL` in `.env` to point to a database whose name ends in `_test`.

The test database reset must be explicitly enabled in the test environment:

```env
ALLOW_DB_TEST_RESET=true
```

Then run:

```bash
npm run test:db
```

### Browser end-to-end tests

```bash
npm run test:e2e
```

**Important:** Database and browser test workflows may reset test data. Never point test configuration at a production database or a database containing information you need to keep. Do not run reset-based test suites against the normal development database.

### Production build

```bash
npm run build
```

## Order Process

The current order process follows these steps:

1. A customer browses the available shops.
2. The customer opens a shop and selects products.
3. Selected products are added to the cart.
4. The customer reviews the cart and proceeds to checkout.
5. The customer signs in or registers if they are not already authenticated.
6. The system validates the order, shop availability and stock.
7. The order is saved and the required stock is reserved.
8. The vendor receives the order and updates its status.
9. The customer collects the order and pays at the shop.

## Security

The application includes several security controls:

- Passwords are hashed before being stored.
- User sessions are stored server-side in MySQL.
- Role-based access checks protect customer, vendor and administrator functions.
- Vendor resources are checked against ownership permissions.
- CSRF and request-origin checks protect application changes.
- Login attempts are subject to rate limiting.
- Private vendor documents are stored separately from public application assets.
- Uploaded documents are checked before being accepted.
- Production configuration requires HTTPS and private object storage.

Keep environment files, database credentials, session secrets, private documents and real user information out of the Git repository.

## Current Scope and Limitations

The current implementation supports customer and vendor accounts, vendor approval, product and stock management, collection ordering, order processing and administrator functions.

The following are not included as completed production services:

- Online payment processing.
- Delivery-driver management and delivery tracking.
- Production hosting and deployment configuration.
- Live production S3 storage, HTTPS certificates and backup verification.
- Email-based account recovery and external notification services.
- Some later-stage moderation, reporting and order-management functions.

The application should be treated as a development project until production infrastructure, security configuration and operational procedures have been set up and tested.

## Documentation

Additional project information is available in the `docs/` directory:

- `docs/specification/` — system blueprint, requirements and design material.
- `docs/api/` — API route and workflow documentation.
- `docs/decisions/` — technical decisions made during development.
- `docs/runbooks/` — local setup and verification instructions.
- `docs/implementation-status.md` — implementation notes, test evidence and known limitations.

For additional setup details, see [`SETUP.md`](SETUP.md).

## License

No licence has been specified for this project. Contact the project owner before reusing or distributing the source code.
