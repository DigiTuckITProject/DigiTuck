# Migrated API additions

Prefix `/api/v1`; existing authentication, sessions, CSRF/Origin, account, vendor profile/documents, catalogue/inventory, admin review/users/audit and health APIs were copied intact. See phase-two.json and catalogue.md. All errors use the standard envelope; all writes require CSRF and the configured Origin. Money is a decimal string; IDs are UUIDs.

| Method/path | Access | Fields / response |
|---|---|---|
| POST `/checkout/quote` | Customer | `{ shopId, items: [{ productId, quantity, expectedUnitPrice }], notes? }` → shopName, address, items with current/previous price, stock, availability, total, canOrder |
| POST `/orders` | Customer | Same body + UUID `Idempotency-Key` header → 201 `{ id, reference }`; identical retry replays original 201 without reserving twice |
| GET `/orders`, `/vendor/orders` | Customer/vendor owner | Bounded page/limit; own summaries including reference, status, exact total, shop/address snapshot, created/expiry times, version and customerName |
| GET `/orders/:id`, `/vendor/orders/:id` | Customer/vendor owner | Summary + notes + item snapshots (name, quantity, unit price and line total) |
| POST `/orders/:id/transitions`, `/vendor/orders/:id/transitions` | Customer/vendor owner | `{ expectedVersion, status, reason? }`; allowed roles/statuses enforced under locks; customer only pending cancellation |
| GET `/vendor/dashboard` | Vendor | Own shop identity/status, total orders/products, pending count, collectedValue and five recent orders |
| GET/PATCH `/account/preferences` | Signed-in user | `{ orderNotifications: boolean }`; own persisted dashboard-alert preference |
| POST `/vendor/products/:id/image` | Owning vendor | Multipart `image` and `expectedVersion`; decoded JPEG/PNG/WebP, 2MB, re-encoded WebP; version increment |
| GET `/products/:id/image` | Public for visible products or owning vendor | Authorized image bytes, never raw object keys; private/unavailable returns 404 |

`Product.imageUrl` is now included when an image exists. Public visibility checks include shop approval/suspension/owner activity and product/category flags. Vendor product metadata writes and stock adjustments remain strict allowlists.

Checkout limits: 1..50 distinct product IDs, quantity 1..99 per line, notes max500, one shop. Rejects unavailable shops/items, insufficient stock, changed expected prices and oversized totals. Quote does not reserve. Order placement locks idempotency → shop → sorted products, checks the active customer, computes exact cents, inserts immutable snapshots and reserve ledger entries atomically. Bounded deadlock retry preserves the same key. A 409 CART_CHANGED requires refresh/review; ambiguous network errors must retry the original attempt.

Fulfilment: PENDING→ACCEPTED→PREPARING→READY→COLLECTED. Vendor PENDING→REJECTED and ACCEPTED→CANCELLED require a reason. Customer PENDING→CANCELLED is allowed. Expired pending orders become EXPIRED and release once. Terminal/stale actions return409. PREPARING/READY cancellation is deliberately rejected until explicit per-item resalable disposition is implemented.
