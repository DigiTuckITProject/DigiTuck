import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Outlet, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Products from './pages/products'
import StoreProfile from './pages/StoreProfile'
import Settings from './pages/Settings'
import { AuthPage, AccountPage, Guard } from './pages/Auth'
import { ShopCatalogue, VendorProducts } from './pages/Catalogue'
import { ReviewsPage, ReviewPage, UsersPage, AuditPage } from './pages/Admin'
import { CartPage, CheckoutPage } from './pages/Cart'
import { OrdersPage, OrderPage } from './pages/OrderPages'
import { useCart } from './lib/cart'
import { api, useUser } from './lib/api'
import { Notice, useAction } from './components/Forms'
import './App.css'
import './integration.css'
function Layout({ area = 'customer' }) {
  const { data: user } = useUser(), { cart } = useCart(), cache = useQueryClient(), navigate = useNavigate(), location = useLocation(), main = useRef(null), action = useAction()
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  useEffect(() => { main.current?.focus(); window.scrollTo(0, 0) }, [location.pathname])
  return <div className="app-container"><a className="skip-link" href="#main">Skip to content</a><Sidebar area={area} user={user} count={count} logout={() => void action.run(async () => { await api('/auth/logout', 'POST'); cache.clear(); navigate('/shops') })} /><main ref={main} tabIndex={-1} id="main" className="main-content"><Notice error={action.error} /><Outlet /></main></div>
}
function Discover() {
  const [page, setPage] = useState(1), query = useQuery({ queryKey: ['shops', page], queryFn: () => api('/shops?page=' + page) })
  return <><div className="dashboard-header"><div><h1>Your local tuckshop hub</h1><p>Everyday essentials, fresh bites and neighbourhood favourites.</p></div><Link className="save-product-btn" to="/cart">View cart</Link></div><div className="content-card collection-banner"><strong>Shop local. Collect nearby.</strong><p>Choose a tuckshop, fill your cart and sign in when you are ready to checkout.</p></div><h2 className="section-heading">Discover tuckshops</h2><Notice error={query.error} />{query.isPending && <p role="status">Finding local shops…</p>}{query.data?.length === 0 && <div className="content-card"><p>No shops on this page yet.</p><Link to="/vendor/register">Become a vendor</Link></div>}<div className="product-grid">{query.data?.map(shop => <article className="product-card shop-card" key={shop.id}><span className="product-category">{shop.is_paused ? 'Temporarily paused' : 'Approved tuckshop'}</span><h2><Link to={'/shops/' + shop.slug}>{shop.name}</Link></h2><p>{shop.description}</p><p>{shop.area} · {shop.address}</p><p>{shop.productCount} products · {shop.availableUnits} units available</p><Link className="save-product-btn" to={'/shops/' + shop.slug}>View products</Link></article>)}</div><div className="catalogue-actions"><button className="cancel-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous shops</button><span>Page {page}</span><button className="cancel-btn" disabled={!query.data || query.data.length < 20} onClick={() => setPage(page + 1)}>Next shops</button></div></>
}
export default function App() {
  return <Routes><Route element={<Layout />}><Route index element={<Navigate to="/shops" replace />} /><Route path="/shops" element={<Discover />} /><Route path="/shops/:slug" element={<ShopCatalogue />} /><Route path="/cart" element={<CartPage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/login" element={<AuthPage />} /><Route path="/register" element={<AuthPage register />} /><Route path="/vendor/register" element={<AuthPage register vendor />} /><Route element={<Guard />}><Route path="/account" element={<AccountPage />} /></Route><Route element={<Guard role="CUSTOMER" />}><Route path="/orders" element={<OrdersPage />} /><Route path="/orders/:id" element={<OrderPage />} /></Route><Route path="*" element={<><h1>Page not found</h1><Link to="/shops">Browse tuckshops</Link></>} /></Route><Route element={<Guard role="VENDOR" />}><Route element={<Layout area="vendor" />}><Route path="/vendor" element={<Dashboard />} /><Route path="/vendor/products" element={<Products />} /><Route path="/vendor/inventory" element={<VendorProducts inventory />} /><Route path="/vendor/shop" element={<StoreProfile />} /><Route path="/vendor/onboarding" element={<StoreProfile />} /><Route path="/vendor/settings" element={<Settings />} /><Route path="/vendor/orders" element={<OrdersPage vendor />} /><Route path="/vendor/orders/:id" element={<OrderPage vendor />} /></Route></Route><Route element={<Guard role="ADMIN" />}><Route element={<Layout area="admin" />}><Route path="/admin" element={<Navigate to="/admin/vendors" replace />} /><Route path="/admin/vendors" element={<ReviewsPage />} /><Route path="/admin/vendors/:id" element={<ReviewPage />} /><Route path="/admin/users" element={<UsersPage />} /><Route path="/admin/audit" element={<AuditPage />} /></Route></Route></Routes>
}
