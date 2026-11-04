import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await login(form.email.trim(), form.password); navigate('/browse'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function google() {
    setError(''); setBusy(true);
    try { await loginWithGoogle(); navigate('/browse'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <AuthLayout title="Welcome back" subtitle="Log in to continue to DEV@Deakin.">
    {error && <p className="form-error">{error}</p>}
    <form className="form-stack" onSubmit={submit}>
      <label>Email address<input type="email" required value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} /></label>
      <label>Password<input type="password" required minLength="6" value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} /></label>
      <button className="button full-width" disabled={busy}>{busy ? 'Please wait…' : 'Log in'}</button>
    </form>
    <button className="button button-outline full-width google-button" onClick={google} disabled={busy}>Continue with Google</button>
    <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
  </AuthLayout>;
}

export function Register() {
  const { register, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault(); setError('');
    if (form.name.trim().length < 2) { setError('Name must contain at least 2 characters.'); return; }
    setBusy(true);
    try { await register(form.name, form.email.trim(), form.password); navigate('/browse'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function google() {
    setError(''); setBusy(true);
    try { await loginWithGoogle(); navigate('/browse'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <AuthLayout title="Join the community" subtitle="Create your DEV@Deakin account.">
    {error && <p className="form-error">{error}</p>}
    <form className="form-stack" onSubmit={submit}>
      <label>Full name<input required minLength="2" value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} /></label>
      <label>Email address<input type="email" required value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} /></label>
      <label>Password<input type="password" required minLength="8" value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} /><small>Use at least 8 characters.</small></label>
      <button className="button full-width" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
    <button className="button button-outline full-width google-button" onClick={google} disabled={busy}>Continue with Google</button>
    <p className="auth-switch">Already registered? <Link to="/login">Log in</Link></p>
  </AuthLayout>;
}

function AuthLayout({ title, subtitle, children }) {
  return <main className="auth-page"><section className="auth-card"><span className="eyebrow">DEV@DEAKIN ACCOUNT</span><h1>{title}</h1><p>{subtitle}</p>{children}</section></main>;
}
