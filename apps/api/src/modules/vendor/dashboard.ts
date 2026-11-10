import type { Knex } from 'knex'
export async function dashboard(db: Knex, owner: string) {
  return db.transaction(async trx => {
    const shop = await trx('shops').where({ owner_id: owner }).select('id', 'name', 'address', 'approval_status', 'is_paused').first()
    if (!shop) return { shop: null, orders: 0, products: 0, pending: 0, collectedValue: '0.00', recent: [] }
    const orders = await trx('orders').where({ shop_id: shop.id }).count('* as total').first()
    const products = await trx('products').where({ shop_id: shop.id }).whereNull('archived_at').count('* as total').first()
    const pending = await trx('orders').where({ shop_id: shop.id, status: 'PENDING' }).count('* as total').first()
    const collected = await trx('orders').where({ shop_id: shop.id, status: 'COLLECTED' }).sum('total_amount as value').first()
    const recent = await trx('orders').where({ shop_id: shop.id }).select('id', 'reference', 'total_amount', 'status').orderBy('created_at', 'desc').limit(5)
    return { shop, orders: Number(orders?.total || 0), products: Number(products?.total || 0), pending: Number(pending?.total || 0), collectedValue: collected?.value || '0.00', recent }
  })
}
