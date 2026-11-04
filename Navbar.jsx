import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link className="brand" to="/"><span className="brand-mark">D</span><span>DEV<span className="brand-at">@</span>Deakin</span></Link>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/">Home</NavLink>
          {user && <NavLink to="/new-post">New Post</NavLink>}
          <NavLink to="/browse">Browse Posts</NavLink>
          <NavLink to="/pricing">Plans</NavLink>
        </nav>
        <div className="nav-account">
          {user ? <>
            <span className={`plan-badge ${profile?.subscriptionPlan === 'paid' ? 'paid' : ''}`}>{profile?.subscriptionPlan || 'free'} plan</span>
            <span className="nav-user">{user.displayName || user.email}</span>
            <button className="button button-quiet button-small" onClick={logout}>Log out</button>
          </> : <Link className="button button-small" to="/login">Log in</Link>}
        </div>
      </div>
    </header>
  );
}
