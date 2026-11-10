import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider } from './lib/cart'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
const client = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 0 } } })
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><QueryClientProvider client={client}><BrowserRouter><CartProvider><App /></CartProvider></BrowserRouter></QueryClientProvider></React.StrictMode>)
