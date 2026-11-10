import { describe, it, expect } from 'vitest'
import { randomUUID } from 'node:crypto'
import { addItem, emptyCart, parseCart } from '../../src/lib/cart'
import type { Product, PublicShop } from '@digituck/contracts'
const shop: PublicShop = { id: randomUUID(), slug: 'shop', name: 'Shop', description: '', area: 'Area', address: 'Address', is_paused: false, productCount: 1, availableUnits: 5 }
const product: Product = { id: randomUUID(), name: 'Bread', price: '12.50', description: '', categoryId: randomUUID(), categoryName: 'Food', availableQuantity: 5, isVisible: true, moderationHidden: false, lowStockThreshold: 2, version: 1 }
describe('guest cart', () => {
  it('merges quantities and rejects excessive stock, fractions and another shop', () => {
    const cart = addItem(emptyCart(), shop, product, 2)
    expect(addItem(cart, shop, product, 1).items[0]?.quantity).toBe(3)
    expect(() => addItem(cart, shop, product, 4)).toThrow()
    expect(() => addItem(cart, shop, product, 1.5)).toThrow()
    expect(() => addItem(cart, { ...shop, id: randomUUID() }, product, 1)).toThrow()
  })
  it('restores valid cached carts and safely rejects corrupt or unsupported storage', () => {
    const cart = addItem(emptyCart(), shop, product, 2)
    expect(parseCart(JSON.stringify(cart))).toEqual(cart)
    expect(parseCart('invalid')).toEqual(emptyCart())
    expect(parseCart(JSON.stringify({ ...cart, version: 9 }))).toEqual(emptyCart())
    expect(parseCart(JSON.stringify({ ...cart, shop: null }))).toEqual(emptyCart())
  })
})
