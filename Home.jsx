import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, profile } = useAuth();
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">LEARN · SHARE · BUILD</span>
          <h1>Ideas grow when<br /><em>we share them.</em></h1>
          <p>A welcoming space for Deakin learners to ask questions, publish articles and learn from one another.</p>
          <div className="hero-actions">
            <Link className="button" to="/browse">Explore posts</Link>
            <Link className="button button-outline" to={user ? '/new-post' : '/register'}>{user ? 'Write a post' : 'Join the community'}</Link>
          </div>
          {user && <p className="welcome-line">Welcome back. Your account is on the <strong>{profile?.subscriptionPlan || 'free'}</strong> plan.</p>}
        </div>
        <div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-card"><span>DEV@Deakin</span><strong>Share what<br />you discover.</strong><small>Questions & Articles</small></div><span className="art-dot dot-one" /><span className="art-dot dot-two" /></div>
      </section>
      <section className="feature-strip">
        <div><span>01</span><h3>Ask questions</h3><p>Get help and learn together.</p></div>
        <div><span>02</span><h3>Publish articles</h3><p>Share useful ideas and experience.</p></div>
        <div><span>03</span><h3>Discover more</h3><p>Find posts that match your interests.</p></div>
      </section>
    </main>
  );
}
