import { beforeAll, afterAll, it, expect } from 'vitest'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import '../../apps/api/src/config.js'
import { createDatabase } from '../../apps/api/src/db/client.js'
import { place, quote, detail, transition, expirePending } from '../../apps/api/src/modules/orders/service.js'
import type { CheckoutInput, SafeUser } from '@digituck/contracts'
const url = process.env.TEST_DATABASE_URL
if (!url || !new URL(url).pathname.endsWith('_test') || process.env.ALLOW_DB_TEST_RESET !== 'true') throw new Error('Disposable MySQL test database required.')
const db = createDatabase(url)
const vendor: SafeUser = { id: randomUUID(), role: 'VENDOR', fullName: 'Vendor', email: 'orders-vendor@example.invalid', phone: '+27821110001' }
const customer: SafeUser = { id: randomUUID(), role: 'CUSTOMER', fullName: 'Customer', email: 'orders-customer@example.invalid', phone: '+27821110002' }
const other: SafeUser = { ...customer, id: randomUUID(), email: 'orders-other@example.invalid', phone: '+27821110003' }
const shop = randomUUID(), category = 'ca000000-0000-4000-8000-000000000001'
let completed: string
beforeAll(async () => {
  const [rows] = await db.raw('SELECT VERSION() AS version'); expect(rows[0].version).toMatch(/^8\.4\./)
  const migrations = { directory: fileURLToPath(new URL('../../db/migrations', import.meta.url)), loadExtensions: ['.mjs'] }
  await db.migrate.rollback(migrations, true); await db.migrate.latest(migrations)
  for (const user of [vendor, customer, other]) await db('users').insert({ id: user.id, role: user.role, full_name: user.fullName, normalized_email: user.email, normalized_phone: user.phone, password_hash: 'not-a-login-fixture' })
  await db('shops').insert({ id: shop, owner_id: vendor.id, slug: 'orders-shop', name: 'Original Shop', address: '12 Original Street', phone: vendor.phone, area: 'Soweto', approval_status: 'APPROVED', is_paused: false, hours_json: JSON.stringify(Array.from({ length: 7 }, (_, day) => ({ day, open: '00:00', close: '23:59' }))) })
})
afterAll(async () => { await db.destroy() })
async function cart(quantity = 1, stock = 10): Promise<CheckoutInput> {
  const productId = randomUUID()
  await db('products').insert({ id: productId, shop_id: shop, category_id: category, name: 'Original Product', price: '12.50', available_qty: stock })
  return { shopId: shop, items: [{ productId, quantity, expectedUnitPrice: '12.50' }], notes: '' }
}
it('reserves the last unit once across two customers in real MySQL', async () => {
  const input = await cart(1, 1)
  const outcomes = await Promise.allSettled([place(db, customer.id, randomUUID(), input), place(db, other.id, randomUUID(), input)])
  expect(outcomes.filter(value => value.status === 'fulfilled')).toHaveLength(1)
  expect(outcomes.filter(value => value.status === 'rejected')).toHaveLength(1)
  expect((await db('products').where({ id: input.items[0]!.productId }).first()).available_qty).toBe(0)
  expect(await db('inventory_movements').where({ product_id: input.items[0]!.productId })).toHaveLength(1)
})
it('replays concurrent duplicate/lost responses once and rejects key reuse with different content', async () => {
  const input = await cart(2), key = randomUUID()
  const results = await Promise.all([place(db, customer.id, key, input), place(db, customer.id, key, input)])
  expect(results[0]).toEqual(results[1]); expect(await place(db, customer.id, key, input)).toEqual(results[0])
  await expect(place(db, customer.id, key, { ...input, notes: 'Different request' })).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' })
  expect((await db('products').where({ id: input.items[0]!.productId }).first()).available_qty).toBe(8)
  expect(await db('inventory_movements').where({ product_id: input.items[0]!.productId })).toHaveLength(1)
  completed = results[0]!.id
})
it('keeps snapshots and enforces ownership and legal versioned fulfilment transitions', async () => {
  await expect(detail(db, other, completed)).rejects.toMatchObject({ status: 404 })
  await expect(transition(db, other, completed, 1, 'CANCELLED', '')).rejects.toMatchObject({ status: 404 })
  await expect(transition(db, customer, completed, 1, 'COLLECTED', '')).rejects.toMatchObject({ status: 409 })
  const before = await detail(db, customer, completed)
  await db('products').whereIn('id', db('order_items').where({ order_id: completed }).select('product_id')).update({ name: 'New name', price: '99.99' })
  await db('shops').where({ id: shop }).update({ name: 'Renamed shop', address: 'New collection address' })
  const after = await detail(db, customer, completed)
  expect(after.items).toEqual(before.items); expect(after.shop_name_snapshot).toBe('Original Shop'); expect(after.total_amount).toBe('25.00')
  await transition(db, vendor, completed, 1, 'ACCEPTED', '')
  await expect(transition(db, vendor, completed, 1, 'PREPARING', '')).rejects.toMatchObject({ status: 409 })
  await transition(db, vendor, completed, 2, 'PREPARING', '')
  await expect(transition(db, vendor, completed, 3, 'CANCELLED', 'Prepared food')).rejects.toMatchObject({ status: 409 })
  await transition(db, vendor, completed, 3, 'READY', '')
  await transition(db, vendor, completed, 4, 'COLLECTED', '')
  expect((await detail(db, customer, completed)).status).toBe('COLLECTED')
})
it('rejects changed prices, hidden items, cross-shop products, insufficient stock and closed shops', async () => {
  const input = await cart(2, 1)
  expect((await quote(db, input)).canOrder).toBe(false)
  await expect(place(db, customer.id, randomUUID(), input)).rejects.toMatchObject({ code: 'CART_CHANGED' })
  input.items[0]!.quantity = 1; input.items[0]!.expectedUnitPrice = '1.00'
  expect((await quote(db, input)).items[0]?.price).toBe('12.50')
  await expect(place(db, customer.id, randomUUID(), input)).rejects.toMatchObject({ code: 'CART_CHANGED' })
  await db('products').where({ id: input.items[0]!.productId }).update({ is_visible: false })
  expect((await quote(db, input)).canOrder).toBe(false)
  input.items[0]!.productId = randomUUID()
  await expect(place(db, customer.id, randomUUID(), input)).rejects.toMatchObject({ code: 'CART_CHANGED' })
  await db('shops').where({ id: shop }).update({ is_paused: true })
  await expect(place(db, customer.id, randomUUID(), input)).rejects.toMatchObject({ code: 'SHOP_UNAVAILABLE' })
  await db('shops').where({ id: shop }).update({ is_paused: false })
})
it('rolls back order, items, stock and idempotency when the ledger insert fails', async () => {
  const input = await cart(), key = randomUUID()
  await db.raw("CREATE TRIGGER test_reserve_failure BEFORE INSERT ON inventory_movements FOR EACH ROW BEGIN IF NEW.type = 'RESERVE' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Injected failure'; END IF; END")
  try { await expect(place(db, customer.id, key, input)).rejects.toThrow() } finally { await db.raw('DROP TRIGGER test_reserve_failure') }
  expect((await db('products').where({ id: input.items[0]!.productId }).first()).available_qty).toBe(10)
  expect(await db('idempotency_requests').where({ request_key: key })).toHaveLength(0)
  expect(await db('order_items').where({ product_id: input.items[0]!.productId })).toHaveLength(0)
  await place(db, customer.id, key, input)
})
it('cancels once and releases the original quantity once under a race', async () => {
  const input = await cart(3), order = await place(db, customer.id, randomUUID(), input)
  const results = await Promise.allSettled([transition(db, customer, order.id, 1, 'CANCELLED', ''), transition(db, customer, order.id, 1, 'CANCELLED', '')])
  expect(results.filter(value => value.status === 'fulfilled')).toHaveLength(1)
  expect((await db('products').where({ id: input.items[0]!.productId }).first()).available_qty).toBe(10)
  expect(await db('inventory_movements').where({ order_id: order.id, type: 'RELEASE' })).toHaveLength(1)
})
it('expires pending orders once and prevents acceptance after their deadline', async () => {
  const input = await cart(2)
  // Insert an already-expired order directly: production snapshot triggers correctly prevent changing deadlines.
  const id = randomUUID()
  await db('orders').insert({ id, reference: 'DT-' + id.slice(0, 20), customer_id: customer.id, shop_id: shop, total_amount: '25.00', shop_name_snapshot: 'Expired', pickup_address_snapshot: 'Address', expires_at: new Date(Date.now() - 60000) })
  await db('order_items').insert({ id: randomUUID(), order_id: id, shop_id: shop, product_id: input.items[0]!.productId, name_snapshot: 'Product', quantity: 2, unit_price: '12.50', line_total: '25.00' })
  await db('products').where({ id: input.items[0]!.productId }).update({ available_qty: 8 })
  await Promise.all([expirePending(db), transition(db, vendor, id, 1, 'ACCEPTED', '').catch(error => { expect(error.status).toBe(409) })])
  await expirePending(db)
  expect((await detail(db, customer, id)).status).toBe('EXPIRED')
  expect((await db('products').where({ id: input.items[0]!.productId }).first()).available_qty).toBe(10)
  expect(await db('inventory_movements').where({ order_id: id, type: 'RELEASE' })).toHaveLength(1)
})
