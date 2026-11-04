import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Pricing() {
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  async function upgrade() {
    if (!user) { navigate('/login'); return; }
    setBusy(true); setMessage('');
    try {
      const token = await user.getIdToken();
      const result = await apiRequest('/api/subscription/checkout', {method:'POST',token,body:JSON.stringify({})});
      window.location.assign(result.url);
    } catch (error) { setMessage(error.message); setBusy(false); }
  }

  async function checkPayment() {
    setBusy(true);
    try { await refreshProfile(); setMessage('Your account status has been refreshed.'); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  return <main className="content-page narrow-page">
    <div className="page-heading centered"><span className="eyebrow">MEMBERSHIP</span><h1>Choose how you learn</h1><p>Start free and upgrade when you want access to members-only posts.</p></div>
    {message && <div className="inline-warning">{message}</div>}
    {new URLSearchParams(window.location.search).get('payment') === 'success' && <div className="notice success">Payment completed or processing. Refresh your account status below.</div>}
    <div className="pricing-grid">
      <section className="price-card"><span className="eyebrow">START HERE</span><h2>Free</h2><p className="price">₹0 <small>/ forever</small></p><p>Explore the community and publish free posts.</p><ul><li>Browse free Questions and Articles</li><li>Create Questions and Articles</li><li>Filter, hide and expand posts</li></ul><span className="current-plan">{profile?.subscriptionPlan === 'free' || !profile ? 'Free access' : 'Included'}</span></section>
      <section className="price-card featured"><span className="eyebrow">MORE TO EXPLORE</span><h2>Paid</h2><p className="price">Set in Stripe <small>/ billing period</small></p><p>Unlock paid-only posts from the community.</p><ul><li>Everything in Free</li><li>Read free and paid posts</li><li>Publish paid-access posts</li></ul>
        {profile?.subscriptionPlan === 'paid' ? <button className="button full-width" onClick={checkPayment} disabled={busy}>Refresh membership</button> : <button className="button full-width" onClick={upgrade} disabled={busy}>{busy ? 'Opening checkout…' : 'Upgrade with Stripe'}</button>}
      </section>
    </div>
    <p className="privacy-note">Checkout uses Stripe. The server changes your plan only after it receives a verified payment webhook. Configure Stripe test credentials before testing upgrades.</p>
  </main>;
}
