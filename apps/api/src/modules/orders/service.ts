import { createHash, randomUUID, randomBytes } from 'node:crypto'
import type { Knex } from 'knex'
import { fromCents, toCents, lineTotal, type CheckoutInput, type Quote, type SafeUser, type PlacedOrder } from '@digituck/contracts'
import { HttpError, notFound } from '../../lib/errors.js'
import { jsonValue, type ShopRow } from '../vendor/repository.js'

export async function transaction<T>(db: Knex, work: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await db.transaction(work) } catch (error) {
      const code = (error as { code?: string }).code
      if (attempt >= 2 || !['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(code || '')) throw error
    }
  }
}
export function isOpen(shop: Pick<ShopRow, 'hours_json' | 'timezone'>, now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: shop.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const part = (type: string) => parts.find(value => value.type === type)?.value || ''
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(part('weekday'))
  const time = part('hour') + ':' + part('minute')
  const hours = jsonValue(shop.hours_json) as { day: number; open: string; close: string }[]
  return Array.isArray(hours) && hours.some(hour => hour.day === day && hour.open <= time && time < hour.close)
}
async function review(trx: Knex.Transaction, input: CheckoutInput, now: Date): Promise<Quote> {
  const shop = await trx<ShopRow>('shops').where({ id: input.shopId }).forUpdate().first()
  if (!shop || shop.approval_status !== 'APPROVED' || shop.suspended_at) throw new HttpError(409, 'SHOP_UNAVAILABLE', 'This shop is not accepting orders.')
  const owner = await trx('users').where({ id: shop.owner_id, status: 'ACTIVE' }).first()
  if (!owner || shop.is_paused || !isOpen(shop, now)) throw new HttpError(409, 'SHOP_UNAVAILABLE', 'This shop is paused or closed. Please try during its opening hours.')
  const rows = await trx('products').where({ shop_id: shop.id }).whereIn('id', input.items.map(item => item.productId)).orderBy('id').forUpdate()
  const categories = await trx('categories').whereIn('id', rows.map(row => row.category_id)).where({ is_active: true }).select('id')
  const activeCategories = new Set(categories.map(category => category.id))
  const items = input.items.map(item => {
    const row = rows.find(row => row.id === item.productId)
    const availableForSale = !!row && !row.archived_at && !row.moderation_hidden_at && !!row.is_visible && activeCategories.has(row.category_id)
    return { productId: item.productId, name: row?.name || 'Unavailable product', quantity: item.quantity, price: row?.price || item.expectedUnitPrice, previousPrice: item.expectedUnitPrice, available: availableForSale ? row.available_qty as number : 0, availableForSale }
  })
  const cents = items.reduce((sum, item) => sum + toCents(item.price) * item.quantity, 0)
  if (cents > 9_999_999_999) throw new HttpError(422, 'TOTAL_TOO_LARGE', 'Reduce the cart total before checkout.')
  return { shopName: shop.name, address: shop.address, items, total: fromCents(cents), canOrder: items.every(item => item.availableForSale && item.available >= item.quantity) }
}
export const quote = (db: Knex, input: CheckoutInput) => transaction(db, trx => review(trx, input, new Date()))
export async function place(db: Knex, customer: string, key: string, input: CheckoutInput): Promise<PlacedOrder> {
  const canonical = { ...input, items: [...input.items].sort((a, b) => a.productId.localeCompare(b.productId)) }
  const hash = createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
  return transaction(db, async trx => {
    const identity = { user_id: customer, operation: 'checkout', request_key: key }
    await trx('idempotency_requests').insert({ id: randomUUID(), ...identity, request_hash: hash }).onConflict().ignore()
    const saved = await trx('idempotency_requests').where(identity).forUpdate().first()
    if (saved.request_hash !== hash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'This checkout key was already used for a different cart.')
    if (saved.response_json) return jsonValue(saved.response_json) as PlacedOrder
    const now = new Date(), checked = await review(trx, canonical, now)
    const account = await trx('users').where({ id: customer, role: 'CUSTOMER', status: 'ACTIVE' }).forShare().first()
    if (!account) throw new HttpError(403, 'CUSTOMER_REQUIRED', 'Sign in with an active customer account.')
    if (!checked.canOrder || checked.items.some(item => item.price !== item.previousPrice)) throw new HttpError(409, 'CART_CHANGED', 'Prices or stock changed. Review the latest cart before placing your order.')
    const result = { id: randomUUID(), reference: 'DT-' + randomBytes(8).toString('hex').toUpperCase() }
    await trx('orders').insert({ ...result, customer_id: customer, shop_id: input.shopId, total_amount: checked.total, notes: input.notes, shop_name_snapshot: checked.shopName, pickup_address_snapshot: checked.address, expires_at: new Date(now.getTime() + 15 * 60000) })
    for (const item of checked.items) {
      await trx('order_items').insert({ id: randomUUID(), order_id: result.id, product_id: item.productId, shop_id: input.shopId, name_snapshot: item.name, unit_price: item.price, quantity: item.quantity, line_total: lineTotal(item.price, item.quantity) })
      const changed = await trx('products').where({ id: item.productId }).where('available_qty', '>=', item.quantity).update({ available_qty: trx.raw('available_qty - ?', [item.quantity]), version: trx.raw('version + 1') })
      if (changed !== 1) throw new HttpError(409, 'CART_CHANGED', 'Stock changed. Review your cart.')
      await trx('inventory_movements').insert({ id: randomUUID(), product_id: item.productId, order_id: result.id, actor_id: customer, type: 'RESERVE', quantity_delta: -item.quantity, available_after: item.available - item.quantity, reason: 'Pickup order placed' })
    }
    await trx('order_events').insert({ id: randomUUID(), order_id: result.id, actor_id: customer, to_status: 'PENDING' })
    await trx('idempotency_requests').where(identity).update({ resource_id: result.id, response_status: 201, response_json: JSON.stringify(result) })
    return result
  })
}
const summaryColumns = ['o.id', 'o.reference', 'o.status', 'o.total_amount', 'o.shop_name_snapshot', 'o.pickup_address_snapshot', 'o.created_at', 'o.expires_at', 'o.version', 'u.full_name as customerName']
function owned(db: Knex, user: SafeUser) {
  const query = db('orders as o').join('shops as s', 's.id', 'o.shop_id').join('users as u', 'u.id', 'o.customer_id')
  return user.role === 'VENDOR' ? query.where('s.owner_id', user.id) : query.where('o.customer_id', user.id)
}
export async function list(db: Knex, user: SafeUser, page: number, limit: number) {
  return owned(db, user).select(summaryColumns).orderBy('o.created_at', 'desc').orderBy('o.id').limit(limit).offset((page - 1) * limit)
}
export async function detail(db: Knex, user: SafeUser, id: string) {
  const order = await owned(db, user).where('o.id', id).select([...summaryColumns, 'o.notes']).first()
  if (!order) throw notFound()
  const items = await db('order_items').where({ order_id: id }).select('id', 'name_snapshot', 'unit_price', 'quantity', 'line_total').orderBy('id')
  return { ...order, items }
}
async function release(trx: Knex.Transaction, id: string, actorId: string | null) {
  const items = await trx('order_items').where({ order_id: id }).orderBy('product_id')
  for (const item of items) {
    const product = await trx('products').where({ id: item.product_id }).forUpdate().first()
    const after = product.available_qty + item.quantity
    await trx('products').where({ id: product.id }).update({ available_qty: after, version: product.version + 1 })
    await trx('order_items').where({ id: item.id }).update({ restocked_qty: item.quantity })
    await trx('inventory_movements').insert({ id: randomUUID(), product_id: product.id, order_id: id, actor_id: actorId, type: 'RELEASE', quantity_delta: item.quantity, available_after: after, reason: 'Unprepared order released' })
  }
}
async function updateState(trx: Knex.Transaction, order: { id: string; status: string; version: number }, status: string, actor: string | null, reason: string) {
  if (['CANCELLED', 'REJECTED', 'EXPIRED'].includes(status)) await release(trx, order.id, actor)
  await trx('orders').where({ id: order.id }).update({ status, version: order.version + 1, ...(status === 'COLLECTED' ? { collected_at: trx.fn.now(3) } : {}) })
  await trx('order_events').insert({ id: randomUUID(), order_id: order.id, actor_id: actor, from_status: order.status, to_status: status, reason })
}
export async function transition(db: Knex, user: SafeUser, id: string, version: number, status: string, reason: string) {
  const found = await owned(db, user).where('o.id', id).select('o.shop_id').first()
  if (!found) throw notFound()
  const result = await transaction(db, async trx => {
    const shop = await trx('shops').where({ id: found.shop_id }).forUpdate().first()
    const order = await trx('orders').where({ id }).forUpdate().first()
    if (!order || (user.role === 'VENDOR' ? shop.owner_id !== user.id : order.customer_id !== user.id)) throw notFound()
    if (order.status === 'PENDING' && new Date(order.expires_at.replace(' ', 'T') + 'Z').getTime() <= Date.now()) {
      await updateState(trx, order, 'EXPIRED', null, 'Vendor did not accept within 15 minutes')
      return false
    }
    if (order.version !== version) throw new HttpError(409, 'STALE_VERSION', 'The order changed. Refresh before trying again.')
    const allowed: Record<string, string[]> = user.role === 'CUSTOMER' ? { PENDING: ['CANCELLED'] } : { PENDING: ['ACCEPTED', 'REJECTED'], ACCEPTED: ['PREPARING', 'CANCELLED'], PREPARING: ['READY'], READY: ['COLLECTED'] }
    if (!allowed[order.status]?.includes(status)) throw new HttpError(409, 'INVALID_STATE', 'This action is not available for the current order status.')
    if (['REJECTED', 'CANCELLED'].includes(status) && user.role === 'VENDOR' && reason.length < 3) throw new HttpError(422, 'REASON_REQUIRED', 'Give a reason for rejecting or cancelling the order.')
    await updateState(trx, order, status, user.id, reason)
    return true
  })
  if (!result) throw new HttpError(409, 'ORDER_EXPIRED', 'This order expired before it was accepted.')
}
export async function expirePending(db: Knex) {
  const candidates = await db('orders').where({ status: 'PENDING' }).where('expires_at', '<=', db.fn.now(3)).select('id', 'shop_id').limit(100)
  for (const candidate of candidates) await transaction(db, async trx => {
    await trx('shops').where({ id: candidate.shop_id }).forUpdate().first()
    const order = await trx('orders').where({ id: candidate.id, status: 'PENDING' }).where('expires_at', '<=', trx.fn.now(3)).forUpdate().first()
    if (order) await updateState(trx, order, 'EXPIRED', null, 'Vendor did not accept within 15 minutes')
  })
}
