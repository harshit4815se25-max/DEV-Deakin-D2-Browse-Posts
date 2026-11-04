import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

export default function BrowsePosts() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [filters, setFilters] = useState({ type:'all', plan:'all', tag:'', date:'' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPosts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const token = user ? await user.getIdToken() : null;
      const result = await apiRequest('/api/posts', { token });
      setPosts(result.posts);
      setHidden([]);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const visiblePosts = useMemo(() => posts.filter((post) => {
    if (hidden.includes(post.id)) return false;
    if (filters.type !== 'all' && post.type !== filters.type) return false;
    if (filters.plan !== 'all' && post.plan !== filters.plan) return false;
    if (filters.tag && !post.tags.some((tag) => tag.includes(filters.tag.toLowerCase()))) return false;
    if (filters.date && !post.createdAt.startsWith(filters.date)) return false;
    return true;
  }), [posts, hidden, filters]);

  function reset() {
    setFilters({type:'all',plan:'all',tag:'',date:''});
    setHidden([]);
  }

  return <main className="content-page">
    <div className="page-heading browse-heading">
      <div><span className="eyebrow">COMMUNITY LIBRARY</span><h1>Browse posts</h1><p>Explore questions and articles shared by the community.</p></div>
      <div className="access-note"><span className="access-dot" />{user ? `Showing content for your ${profile?.subscriptionPlan || 'free'} plan` : 'Browsing as a visitor'}<small>Access is checked securely by the server.</small></div>
    </div>
    <section className="filter-panel">
      <div className="filter-title"><div><strong>Find something useful</strong><span>{visiblePosts.length} posts shown</span></div><button className="text-button" onClick={reset}>Reset filters & hidden posts</button></div>
      <div className="filter-grid">
        <label>Post type<select value={filters.type} onChange={(e)=>setFilters({...filters,type:e.target.value})}><option value="all">All types</option><option value="question">Questions</option><option value="article">Articles</option></select></label>
        <label>Access plan<select value={filters.plan} onChange={(e)=>setFilters({...filters,plan:e.target.value})}><option value="all">All available plans</option><option value="free">Free</option>{profile?.subscriptionPlan === 'paid' && <option value="paid">Paid</option>}</select></label>
        <label>Tag<input value={filters.tag} onChange={(e)=>setFilters({...filters,tag:e.target.value})} placeholder="Search a tag" /></label>
        <label>Created date<input type="date" value={filters.date} onChange={(e)=>setFilters({...filters,date:e.target.value})} /></label>
      </div>
    </section>
    {loading ? <div className="page-state">Loading posts…</div> : error ? <div className="empty-state"><h3>We could not load posts</h3><p>{error}</p><button className="button" onClick={loadPosts}>Try again</button></div> : visiblePosts.length ? <section className="post-grid">{visiblePosts.map((post)=><PostCard key={post.id} post={post} onHide={(id)=>setHidden((current)=>[...current,id])} />)}</section> : <section className="empty-state"><div className="empty-icon">✦</div><h3>No posts to show</h3><p>Try changing your filters, reset hidden posts, or check back later.</p><button className="button button-outline" onClick={reset}>Reset view</button></section>}
    <p className="privacy-note">Paid-only posts are filtered by the backend and are never sent to visitors or Free-plan browsers.</p>
  </main>;
}
