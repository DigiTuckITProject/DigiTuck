import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product, PublicShop } from '@digituck/contracts'
import { addItem, emptyCart, useCart } from '../lib/cart'
import { useUser } from '../lib/api'
import { Notice } from './Forms'
export function AddToCart({ product, shop }: { product: Product; shop: PublicShop }) {
  const { cart, setCart } = useCart(), { data: user } = useUser()
  const [quantity, setQuantity] = useState(1), [replace, setReplace] = useState(false), [error, setError] = useState<unknown>(), [message, setMessage] = useState('')
  const disabled = shop.is_paused || product.availableQuantity < 1 || (!!user && user.role !== 'CUSTOMER')
  function add(replacing = false) {
    if (!replacing && cart.shop && cart.shop.id !== shop.id) { setReplace(true); return }
    try { setCart(addItem(replacing ? emptyCart() : cart, shop, product, quantity)); setReplace(false); setError(null); setMessage(`${quantity} added to your cart.`) } catch (error) { setError(error) }
  }
  return <div className="add-to-cart"><label className="field">Quantity for {product.name}<input type="number" min={1} max={Math.min(99, product.availableQuantity)} step={1} value={quantity} disabled={disabled} onChange={event => setQuantity(Number(event.target.value))} /></label><button className="save-product-btn" disabled={disabled} onClick={() => add()}>Add to cart</button>{!!user && user.role !== 'CUSTOMER' && <p>Use a customer account to place orders.</p>}<Notice error={error} />{message && <p role="status">{message} <Link to="/cart">View cart</Link></p>}{replace && <div className="notice"><p>Your cart contains products from {cart.shop?.name}. Replace them with products from {shop.name}?</p><button className="save-product-btn" onClick={() => add(true)}>Replace cart</button><button className="cancel-btn" onClick={() => setReplace(false)}>Keep current cart</button></div>}</div>
}
