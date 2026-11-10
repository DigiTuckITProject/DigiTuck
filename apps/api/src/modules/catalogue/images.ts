import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import type { Knex } from 'knex'
import type { PrivateStorage } from '../../lib/storage.js'
import { HttpError, notFound } from '../../lib/errors.js'
export async function uploadImage(db: Knex, storage: PrivateStorage, owner: string, id: string, expectedVersion: number, bytes: Buffer) {
  if (bytes.length > 2097152) throw new HttpError(422, 'IMAGE_TOO_LARGE', 'Choose a JPEG, PNG or WebP image up to 2 MB.')
  let encoded: Buffer
  try {
    const image = sharp(bytes, { limitInputPixels: 20_000_000, animated: false })
    const meta = await image.metadata()
    if (!['jpeg', 'png', 'webp'].includes(meta.format || '')) throw new Error('Unsupported format')
    encoded = await image.rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
  } catch { throw new HttpError(422, 'INVALID_IMAGE', 'Choose a valid JPEG, PNG or WebP image.') }
  const key = randomUUID()
  await db.transaction(async trx => {
    const shop = await trx('shops').where({ owner_id: owner }).forUpdate().first()
    if (!shop) throw notFound()
    const product = await trx('products').where({ id, shop_id: shop.id }).whereNull('archived_at').forUpdate().first()
    if (!product) throw notFound()
    if (product.version !== expectedVersion) throw new HttpError(409, 'STALE_VERSION', 'Product changed. Reload before uploading the image.')
    await storage.put(key, encoded, 'image/webp')
    await trx('products').where({ id }).update({ image_key: key, version: product.version + 1 })
  }).catch(async error => { await storage.remove(key).catch(() => {}); throw error })
}
export async function image(db: Knex, storage: PrivateStorage, id: string, owner?: string) {
  const product = await db('products as p').join('shops as s', 's.id', 'p.shop_id').join('users as u', 'u.id', 's.owner_id').join('categories as c', 'c.id', 'p.category_id').where('p.id', id).whereNull('p.archived_at').select('p.image_key', 's.owner_id', 'p.is_visible', 'p.moderation_hidden_at', 's.approval_status', 's.suspended_at', 'u.status', 'c.is_active').first()
  if (!product?.image_key || (product.owner_id !== owner && (!product.is_visible || product.moderation_hidden_at || product.approval_status !== 'APPROVED' || product.suspended_at || product.status !== 'ACTIVE' || !product.is_active))) throw notFound()
  try { return await storage.get(product.image_key) } catch { throw notFound() }
}
