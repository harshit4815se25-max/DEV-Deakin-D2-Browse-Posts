import { useState } from 'react';

export default function PostCard({ post, onHide }) {
  const [expanded, setExpanded] = useState(false);
  const body = post.type === 'article' ? post.content : post.description;
  const preview = body.length > 190 ? `${body.slice(0, 190)}…` : body;

  return (
    <article className="post-card">
      <div className="post-card-top">
        <span className={`type-pill ${post.type}`}>{post.type}</span>
        <span className={`plan-badge ${post.plan === 'paid' ? 'paid' : ''}`}>{post.plan} access</span>
      </div>
      <button className="post-title-button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
        <h3>{post.title}</h3>
      </button>
      {post.type === 'article' && <p className="post-abstract">{post.abstract}</p>}
      <p className="post-body">{expanded ? body : preview}</p>
      {expanded && <p className="post-author">Posted by {post.authorName || 'DEV@Deakin member'}</p>}
      <div className="post-meta">
        <div className="tag-list">{post.tags.map((tag) => <span className="tag" key={tag}>#{tag}</span>)}</div>
        <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString()}</time>
      </div>
      <div className="post-actions">
        <button className="text-button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Show less' : 'Read full post'}
        </button>
        <button className="text-button muted" onClick={() => onHide(post.id)}>Hide from my list</button>
      </div>
    </article>
  );
}
