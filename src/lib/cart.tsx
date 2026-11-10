import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { z } from 'zod'
import { moneySchema, type Product, type PublicShop } from '@digituck/contracts'
const schema = z.object({ version: z.literal(1), shop: z.object({ id: z.uuid(), slug: z.string().max(200), name: z.string().max(160) }).nullable(), items: z.array(z.object({ productId: z.uuid(), name: z.string().max(160), price: moneySchema, quantity: z.number().int().min(1).max(99) })).max(50).refine(items => new Set(items.map(item => item.productId)).size === items.length) })
export type Cart = z.infer<typeof schema>
const empty: Cart = { version: 1, shop: null, items: [] }
export const cartKey = 'digituck.cart.v1'
export function parseCart(raw: string | null): Cart { try { const cart = schema.parse(JSON.parse(raw || 'null')); if (cart.items.length && !cart.shop) return empty; return cart } catch { return empty } }
const Context = createContext<{ cart: Cart; setCart: (cart: Cart) => void; storageError: boolean } | null>(null)
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, update] = useState<Cart>(() => { try { return parseCart(localStorage.getItem(cartKey)) } catch { return empty } }), [storageError, setStorageError] = useState(false)
  function setCart(value: Cart) { update(value); try { localStorage.setItem(cartKey, JSON.stringify(value)); setStorageError(false) } catch { setStorageError(true) } }
  useEffect(() => { const sync = (event: StorageEvent) => { if (event.key === cartKey) update(parseCart(event.newValue)) }; window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync) }, [])
  return <Context.Provider value={{ cart, setCart, storageError }}>{children}</Context.Provider>
}
export function useCart() { const value = useContext(Context); if (!value) throw new Error('CartProvider missing'); return value }
export function addItem(cart: Cart, shop: PublicShop, product: Product, quantity: number): Cart {
  if (cart.shop && cart.shop.id !== shop.id) throw new Error('Confirm replacing the other shop’s cart first.')
  const existing = cart.items.find(item => item.productId === product.id)
  const combined = (existing?.quantity || 0) + quantity
  if (!Number.isInteger(quantity) || quantity < 1 || combined > Math.min(99, product.availableQuantity)) throw new Error('Choose a quantity within the available stock (maximum 99).')
  if (!existing && cart.items.length >= 50) throw new Error('A cart can contain up to 50 different products.')
  const item = { productId: product.id, name: product.name, price: product.price, quantity: combined }
  return { version: 1, shop: { id: shop.id, name: shop.name, slug: shop.slug }, items: existing ? cart.items.map(value => value.productId === product.id ? item : value) : [...cart.items, item] }
}
export const emptyCart = () => ({ ...empty, items: [] })
