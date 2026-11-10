import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { AccountPage } from './Auth'
import { api } from '../lib/api'
import { Feedback, useAction } from '../components/Forms'
export default function Settings() {
  const navigate = useNavigate(), cache = useQueryClient()
  const query = useQuery({ queryKey: ['preferences'], queryFn: () => api('/account/preferences') }), action = useAction()
  return <div className="settings-page"><div className="settings-header"><h1>Settings</h1><p>Manage your vendor account preferences.</p></div><AccountPage /><div className="settings-card"><h2>Order notifications</h2><Feedback action={action} /><label className="checkbox-field"><input type="checkbox" disabled={!query.data || action.pending} checked={query.data?.orderNotifications || false} onChange={event => { const checked = event.target.checked; void action.run(async () => { await api('/account/preferences', 'PATCH', { orderNotifications: checked }); await query.refetch() }, 'Preference saved.') }} /> Show pending-order alerts on your dashboard</label><button className="cancel-btn" disabled={action.pending} onClick={() => void action.run(async () => { await api('/auth/logout', 'POST'); cache.clear(); navigate('/login') })}>Sign out</button></div></div>
}
