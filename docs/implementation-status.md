## Vendor menu correction — 2026-11-09

Restored the original five vendor menu labels and order: Dashboard, Products, Orders, Store Profile, Settings. Removed added Inventory/Browse tuckshops/Sign out entries from that menu. Inventory remains a Products-page action and sign-out is under Settings. Login/register and API integrations are preserved. Future work must preserve the supplied navigation/layout and focus on missing API services unless explicitly requested otherwise.

# New-layout migration checkpoint — 2026-11-09

Active project: `C:/my-projects/clone/DigiTuck/digituck-vendor`. Source project is retained. The new project's existing `src/App.css` was preserved unchanged. The earlier implementation history below describes the source checkpoint; this section supersedes its pending-feature and path statements.

Migrated all existing Express auth/session/account/vendor/private-document/admin/catalogue/inventory services, shared contracts, schema migrations, scripts, infra and regression tests. The target uses the same development MySQL connection and session secret, with API/web ports 4005/5175. Verified the same database contains 3 VENDOR, 2 CUSTOMER and 1 ADMIN accounts. No account/password data was exported, recreated or reset. Copied and byte-verified 1 existing private file; environment and local storage are Git-ignored. MySQL's running native data directory remains in its original managed location; see README before retiring the old directory.

Replaced prototype mock data/alerts with real APIs in the supplied dashboard/products/orders/store/settings layouts. Added matching authentication, registration, customer discovery/catalogue/cart/checkout/order history/detail, inventory, private application and administrator screens. Filled prototype field gaps: real shop identity/status/metrics, customer order names, image persistence/access control, stock/version fields, weekly business hours, account/password settings and persisted in-app notification preference. Migration004 adds only the account preference; applied to local MySQL8.4.13 with no pending migrations.

Completed guest cart and login-at-checkout in this directory: quantity selection, removal, same-shop rule with confirmation, persisted cart, guest-only navigation filtering, fixed checkout return target, exact server quote, atomic order placement with snapshots, stock reservation and database idempotency. Added own-order pages, vendor accept/prepare/ready/collect, unprepared cancellation/rejection and 15-minute pending expiry worker/CLI. Product images are decoded/re-encoded WebP using pinned Sharp0.35.5 and authorized through the API.

Verification: lint, typecheck and production build passed initially. **14 unit/API tests and 30 real-MySQL tests passed**, including last-unit race, concurrent duplicate checkout, payload mismatch, forced mid-transaction rollback, snapshot preservation, ownership, stale transitions, double cancellation, expiry/accept race, image validation/privacy and all migrated regressions. Initial order test fixtures were correctly refused because the test shop inherited paused=true; fixed the fixture to explicitly open it. Browser tests found a real checkout empty-cart redirect race after successful placement; fixed it by making confirmed order state take precedence over the empty-cart redirect. The rerun passed: **8 browser tests** at 1280×900 and 360×800, including guest navigation, cart quantity/removal/persistence, registration return to checkout and real order confirmation. Inspected desktop inventory and mobile catalogue screenshots. Clean npm ci initially hit a Windows lock held by the old target Vite process; stopped that specific development process and retried successfully (406 packages). After the clean install, lint, typecheck, build and all 14 unit/API tests passed again; git diff --check is clean. Started npm run dev from this target directory: Vite5175 and API4005. Through the frontend proxy verified / →200 HTML, /api/v1/health/ready →200 ready, /api/v1/shops →200 with the existing approved shop, and unauthenticated /api/v1/vendor/products →401. The local app is left running. No production deployment occurred.

Limitations: no deployment, cloud resource purchase, online payment or delivery. This is not the entire specification's later-phase implementation: prepared-order cancellation with partial restock, admin order intervention, product/category moderation UI, advanced search/reports, external notifications and live S3/TLS/backup verification remain outside this migration. Existing operational account recovery/document policy decisions remain. Product images replaced in private storage need a future retention/cleanup policy. The build reports a large JS chunk; functionality is verified separately.

See README, docs/decisions/005-new-layout-migration.md and docs/api/migrated-workflows.md.

---

# Catalogue and inventory checkpoint — 2026-11-08

Scope: vendor Products and Inventory tabs, plus customer vendor catalogues and inventory-based counts. Existing changes in `apps/web/src/pages/Vendor.tsx` were preserved. This supersedes the older statement below that all catalogue work is pending; cart/ordering/images/search remain pending.

Implemented product create/edit/hide/archive, initial stock, category and positive decimal-string price validation, low-stock thresholds/filter, signed inventory adjustments with reasons and optimistic versions. API enforces vendor ownership, role, CSRF and Origin. MySQL transactions lock shop then product and write stock and append-only movements atomically. Archived products retain history.

Approved shop cards now open `/shops/:slug`. Customers see visible product counts, total units, per-product quantities and out-of-stock labels. Hidden/moderated/archived products and inactive categories are excluded from public counts; private/suspended shops and inactive owners are inaccessible. Catalogue results have bounded pagination; counts cover the full catalogue. Public catalogue polls every 15 seconds while visible. No cart, checkout or product image upload was added.

Migration 003 supplies non-demo categories, and has been applied to the local development database. `db:check` reports MySQL **8.4.13**, UTC **+00:00**, all three migrations applied and no pending migrations. No dependencies or runtime pins changed. README, requirement mapping, API documentation and decision 004 describe the workflow.

Verification so far: lint and typecheck passed; production build passed; **12 unit/API tests and 22 real-MySQL tests passed**. The new database tests cover cross-vendor/customer denial, strict inputs, draft privacy, visibility/counts, stock races, stale retries, no negative stock, decimal price updates, archive retention and suspended/inactive shop denial. Initial database test launch was safely rejected until `ALLOW_DB_TEST_RESET=true` was supplied for the existing disposable `_test` database. Browser run initially failed on an exact-label dropdown locator; selector corrected and the rerun passed: **8 browser tests at 1280×900 and 360×800**, including vendor approval → product creation → price edit → stock adjustment → public shop counts → catalogue → reload persistence. No browser runtime errors or horizontal overflow were detected. Inspected desktop inventory and mobile catalogue screenshots. Final lint/typecheck and `git diff --check` also passed.

No deployment, push, merge, paid resource or production infrastructure changes. Run with existing environment using `npm run dev`; fresh checkouts must run `npm run db:migrate` first. See `docs/decisions/004-catalogue-inventory.md` and `docs/api/catalogue.md`.

---

# Implementation status — Phase 2 checkpoint

Updated **2026-11-07**, Africa/Johannesburg. Scope: foundation verification followed by accounts and vendor approval. **Stop after Phase 2; no deployment or paid resources.**

## Foundation preserved and verified

Read AGENTS.md, first task, blueprint, master prompt and phase prompts before continuing. Re-ran the existing foundation checks before feature changes: lint, typecheck, 11 unit/API tests, six real-MySQL tests and production build passed. Preserved the React/Express/TypeScript/npm-workspace design, MySQL schema/triggers, seeds, trusted bootstrap and supplied specification/design assets.

Remote main contains the specification pack, while the local Phase 0/1 foundation was uncommitted. The Phase 2 review branch therefore includes the foundation too. The remote base commit is `34b895ceca96300ae829440677e644b0c31b6661` (tree `e41f0537520549958629068717c1c1b55146721f`). Publishing uses the GitHub connector with that existing parent; no unrelated root history or force push.

## Implemented

- Customer/vendor registration, normalized unique email/phone, bcrypt work factor 12, password byte limits, generic login errors, logout, own name/phone edits and password changes. Email is read-only; no public admin signup.
- MySQL-backed sessions, login rotation, HttpOnly/SameSite cookies, production Secure `__Host-` cookie, idle/absolute expiry and auth-version revocation on password/status changes. No tokens in browser storage.
- Synchronizer CSRF and exact Origin checks on every mutation including login and multipart uploads. Persistent account/IP throttle buckets, transactional attempt claims and expiration cleanup.
- Server-side role and ownership enforcement, protected frontend routes and last-active-admin protection under a database lock. Account deactivation revokes sessions and hides owned shops.
- Vendor business profile, validated opening hours, pause flag, document checklist, signature/MIME/size validation, private randomized file storage, authenticated attachment downloads, submit/status/rejection/suspension screens.
- Immutable submitted snapshots and document references. Material business/owner identity changes create a new draft and hide the shop. Revisions preserve suspension. Optimistic shop versions and exact submission versions prevent stale or concurrent approvals.
- Admin review of current/historical submissions, approve/reject/suspend with reasons, user status management and append-only audit history. Only approved shops with active owners are public.
- Responsive login, registration, account, vendor onboarding and administrator pages using existing tokens/layouts. Later-phase catalogue/orders remain clearly unavailable.
- Private local storage adapter and S3 production configuration; production rejects HTTP origins and local-file storage. No bucket/service provisioned.
- Updated README startup/testing instructions, `.env.example`, Phase 2 decision record, requirement mapping and `docs/api/phase-two.json` OpenAPI route/request documentation.

## Verification evidence

Runtime: **Node 24.22.2**, npm **11.18.0**, native **MySQL Community 8.4.13**, loopback port 3307. Test database is a separate disposable `digituck_test`, never the development database. MySQL tests do not use SQLite or mock database persistence.

| Check | Actual result |
|---|---|
| Clean `npm ci --no-fund --no-audit` | Passed; 402 packages. Informational esbuild install-script notice; no policy changes required and build succeeded. |
| `npm run lint` | Passed. |
| `npm run typecheck` | Passed. |
| `npm test` | **12 passed**, including production HTTPS/private-storage/secret configuration guards. |
| `npm run test:db` | **18 passed**: six foundation and twelve Phase 2 real-MySQL tests, including the held-request/logout race regression. |
| `npm run db:check` | MySQL **8.4.13**, UTC **+00:00**, migrations 001 and 002 applied, no pending migrations. |
| Frontend secret/build hygiene | Configured database/password/session values absent from built JS; `.env`, dependencies, builds and test artifacts ignored by Git. |
| `npm run build` | Passed after clean installation: contracts/API TypeScript and Vite production frontend (76 modules). |
| `npm run test:e2e` | **8 passed**, Chromium at 1280×900 and 360×800. Includes customer/vendor registration navigation through login in both directions and browser history, plus the full vendor submission/admin approval journey and protected-route checks. |
| Production-cookie integration | Verified `Secure`, `HttpOnly`, `SameSite=Lax`, `__Host-`, Path=/, no Domain with a trusted HTTPS proxy request. This is not a live TLS deployment test. |
| Private storage integration | Local real-file upload/download and unauthorized denial passed. Invalid signature, MIME mismatch, oversize uploads and submitted-document replacement/deletion rejected. |
| Visual inspection | Inspected desktop admin and mobile vendor screenshots. Fixed an off-screen skip-link appearing in full-page captures; browser suite rerun passed. Screenshots/traces are ignored test artifacts. |

Database coverage includes the six foundation tests plus Phase 2 registration/uniqueness/hash checks, role/ownership denial, CSRF/Origin, durable sessions across independent app/store instances, rotation/logout/password/status revocation, idle/absolute expiry, persistent throttling, private document validation/download, snapshot freeze, exact-version review, competing approvals, suspension/rejection/revision history and last-admin protection.

Failures fixed during implementation: invalid Zod chaining, test TypeScript strictness, API prefix mismatch during wiring, and a production-cookie test inadvertently sharing a session-store instance with a different middleware configuration. Each app in that test now owns its own store, as real server instances do.

## PR #1 review corrections — 2026-11-07

- Reproduced logout resurrection against real MySQL: a separately authenticated request was held open, logout deleted its session, then completing the request restored access (old cookie incorrectly returned 200). The updated store uses INSERT for new sessions and UPDATE-only for loaded/persisted sessions. The same regression now verifies 401 after completion and confirms the deleted session row stays absent; a separate session remains signed in.
- Keyed the authentication form by login/customer/vendor mode. Route transitions reset role and form state; direct links allow switching registration modes. Browser tests cover both directions, manual role changes, login transitions and history navigation on desktop and mobile.
- After these changes, **lint, typecheck, 12 unit/API tests, 18 real-MySQL tests, production build and 8 browser tests all passed**. No schema migration or dependency change was needed. Local MySQL and browser test isolation remain unchanged.
- The fixes update the existing `codex/phase-2-login-vendor-approval` branch for PR #1. Requested frontend/backend branches start from the corrected checkpoint: `codex/frontend` and `codex/backend`. They retain the full repository and shared contracts; work is separated by branch and application directory.

## Limits and operator decisions

- Docker Desktop's Linux engine remains unavailable on this workstation. Compose syntax passed in Phase 1; container startup is unverified. Native MySQL supplied actual integration verification. Its ignored runtime/data under `.git/` must not be reinitialized.
- Live S3/object-store permissions, production TLS/proxy topology, malware scanning, retention, backup restoration and deployment were **not** verified. Production configuration exists; external infrastructure does not.
- `business-proof` is a configurable development checklist, not an asserted legal requirement. The owner must decide real documents, retention and recovery/support before launch. No email recovery provider is configured.
- Local Git Credential Manager cannot authenticate noninteractively. Connector-based Git objects/branch/PR preserve the existing GitHub history. This does not repair workstation Git credentials; preserve the workspace when restoring them.
- No real vendor/admin account or private identity document was created in the development database. Browser fixtures exist only in the disposable test database and use explicit test-only credentials.
- Phase 3 catalogue/cart, Phase 4 orders/stock races, Phase 5 full operations/reports and Phase 6 release/backup work remain pending. No claim of production readiness or security certification.

See README for exact commands and `docs/runbooks/local-verification.md` for this workstation's temporary native runtime. Review branch: `codex/phase-2-login-vendor-approval`. Do not merge or deploy automatically.
