import { useState, useSyncExternalStore } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { checkoutSchema, fromCents, toCents, type CheckoutInput, type PlacedOrder, type Quote } from '@digituck/contracts'
import { api, RequestError, useUser } from '../lib/api'
import { emptyCart, useCart } from '../lib/cart'
import { Heading, Notice } from '../components/Forms'
const onlineSubscribe = (notify: () => void) => { window.addEventListener('online', notify); window.addEventListener('offline', notify); return () => { window.removeEventListener('online', notify); window.removeEventListener('offline', notify) } }
export const useOnline = () => useSyncExternalStore(onlineSubscribe, () => navigator.onLine)
export function CartPage() {
  const { cart, setCart, storageError } = useCart(), online = useOnline()
  const total = cart.items.reduce((sum, item) => sum + toCents(item.price) * item.quantity, 0)
  return <><Heading title="Your cart">Review your items before checkout. One tuckshop per order.</Heading>{storageError && <p role="alert">Your browser could not save the cart. Keep this tab open.</p>}{!online && <p role="status">You are offline. Your cart stays on this device; reconnect to checkout.</p>}{!cart.items.length ? <div className="content-card"><p>Your cart is empty.</p><Link to="/shops">Browse tuckshops</Link></div> : <><h2>{cart.shop?.name}</h2><div className="content-card">{cart.items.map(item => <div className="cart-row" key={item.productId}><div><h3>{item.name}</h3><p>R {item.price} each</p></div><label className="field">Quantity for {item.name}<input type="number" min={1} max={99} step={1} value={item.quantity} onChange={event => { const quantity = Number(event.target.value); if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 99) setCart({ ...cart, items: cart.items.map(value => value.productId === item.productId ? { ...value, quantity } : value) }) }} /></label><strong>R {fromCents(toCents(item.price) * item.quantity)}</strong><button className="delete-btn" onClick={() => { const items = cart.items.filter(value => value.productId !== item.productId); setCart(items.length ? { ...cart, items } : emptyCart()) }}>Remove {item.name}</button></div>)}</div><div className="content-card checkout-summary"><h2>Estimated total: R {total <= 9999999999 ? fromCents(total) : '—'}</h2><p>Stock and prices are checked at checkout. Pay at collection.</p><Link className="cancel-btn" to={'/shops/' + cart.shop?.slug}>Continue shopping</Link>{online && total <= 9999999999 ? <Link className="save-product-btn" to="/checkout">Checkout</Link> : <p>Reconnect or reduce the cart total to continue.</p>}</div></>}</>
}
type Attempt = { userId: string; key: string; body: CheckoutInput; cartSnapshot: string }
const attemptKey = 'digituck.checkout.attempt'
function loadAttempt(userId: string): Attempt | null { try { const value = JSON.parse(sessionStorage.getItem(attemptKey) || 'null'); return value?.userId === userId && typeof value.key === 'string' && /^[a-f0-9-]{36}$/i.test(value.key) && typeof value.cartSnapshot === 'string' && checkoutSchema.safeParse(value.body).success ? value : null } catch { return null } }
export function CheckoutPage() {
  const user = useUser()
  if (user.isPending) return <p role="status">Checking your session…</p>
  if (user.error) return <Notice error={user.error} />
  if (!user.data) return <Navigate to="/login?next=checkout" replace />
  if (user.data.role !== 'CUSTOMER') return <><Heading title="Customer account required" /><p>Sign out and use a customer account to checkout. Your cart will be kept.</p></>
  return <Checkout key={user.data.id} userId={user.data.id} />
}
function Checkout({ userId }: { userId: string }) {
  const { cart, setCart } = useCart(), online = useOnline(), navigate = useNavigate(), cache = useQueryClient()
  const [placed, setPlaced] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt(userId)), [notes, setNotes] = useState(''), [pending, setPending] = useState(false), [error, setError] = useState<unknown>()
  const body: CheckoutInput = { shopId: cart.shop?.id || '', items: cart.items.map(item => ({ productId: item.productId, quantity: item.quantity, expectedUnitPrice: item.price })), notes: '' }
  const query = useQuery({ queryKey: ['checkout-quote', body], queryFn: () => api<Quote>('/checkout/quote', 'POST', body), enabled: !!cart.items.length && online && !attempt, retry: false, staleTime: 0, refetchOnWindowFocus: true })
  async function submit() {
    if (pending) return
    setPending(true); setError(null)
    const current = attempt || { userId, key: crypto.randomUUID(), body: { ...body, notes }, cartSnapshot: JSON.stringify(cart) }
    setAttempt(current)
    try { sessionStorage.setItem(attemptKey, JSON.stringify(current)) } catch { /* In-memory retry still uses the same key. */ }
    try {
      const order = await api<PlacedOrder>('/orders', 'POST', current.body, { 'Idempotency-Key': current.key })
      setPlaced(order.id)
      if (JSON.stringify(cart) === current.cartSnapshot) setCart(emptyCart())
      sessionStorage.removeItem(attemptKey); setAttempt(null)
      void cache.invalidateQueries({ queryKey: ['catalogue'] }); void cache.invalidateQueries({ queryKey: ['shops'] })

    } catch (error) {
      setError(error)
      if (error instanceof RequestError && error.status === 401) { cache.setQueryData(['me'], null); navigate('/login?next=checkout'); return }
      if (error instanceof RequestError && error.status >= 400 && error.status < 500) { setAttempt(null); sessionStorage.removeItem(attemptKey); void query.refetch() }
    } finally { setPending(false) }
  }
  if (placed) return <Navigate to={'/orders/' + placed} replace />
  if (!cart.items.length && !attempt && !pending) return <Navigate to="/cart" replace />
  const quote = query.data, changed = quote?.items.some(item => item.price !== item.previousPrice)
  return <><Heading title="Checkout">Confirm your pickup order. Pay at collection.</Heading><Notice error={error || query.error} />{!online && <p role="alert">You are offline. Reconnect before placing or checking your order.</p>}{attempt ? <div className="content-card"><p role="status">Checking whether your order was placed. Retry this same request before starting another checkout.</p><button className="save-product-btn" disabled={pending || !online} onClick={() => void submit()}>{pending ? 'Checking…' : 'Check order / retry safely'}</button></div> : <>{query.isPending && <p role="status">Checking stock and prices…</p>}<button className="cancel-btn" disabled={pending || !online || query.isFetching} onClick={() => void query.refetch()}>Refresh prices and stock</button>{quote && <div className="content-card"><h2>{quote.shopName}</h2><p>Collect at {quote.address}</p>{quote.items.map(item => <div className="cart-row" key={item.productId}><span>{item.name} × {item.quantity}</span><span>{item.price !== item.previousPrice && <del>R {item.previousPrice} </del>}R {item.price} each</span>{(!item.availableForSale || item.available < item.quantity) && <strong role="alert">Only {item.available} available — adjust your cart.</strong>}</div>)}<h2>Total: R {quote.total}</h2>{changed && <p role="alert">Prices have changed. Review the new prices before continuing.</p>}{changed && <button className="cancel-btn" onClick={() => setCart({ ...cart, items: cart.items.map(item => ({ ...item, price: quote.items.find(value => value.productId === item.productId)?.price || item.price })) })}>Accept updated prices</button>}<label className="field">Order notes<textarea maxLength={500} value={notes} onChange={event => setNotes(event.target.value)} /></label><p>The vendor has 15 minutes to accept. Your order is then prepared for collection.</p><button className="save-product-btn" disabled={!online || pending || query.isFetching || query.isError || !quote.canOrder || changed} onClick={() => void submit()}>{pending ? 'Placing order…' : 'Place pickup order'}</button></div>}<Link to="/cart">Edit cart</Link></>}</>
}
