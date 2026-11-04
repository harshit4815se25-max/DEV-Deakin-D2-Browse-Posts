import { useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import Notice from '../components/Notice';

const initialQuestion = { title: '', description: '', tags: '', plan: 'free' };
const initialArticle = { title: '', abstract: '', content: '', tags: '', plan: 'free' };

function parseTags(value) {
  return [...new Set(value.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

export default function NewPost() {
  const { user, profile } = useAuth();
  const [type, setType] = useState('question');
  const [question, setQuestion] = useState(initialQuestion);
  const [article, setArticle] = useState(initialArticle);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const form = type === 'question' ? question : article;
  const update = type === 'question' ? setQuestion : setArticle;

  function change(field, value) { update((current) => ({ ...current, [field]: value })); }

  async function submit(event) {
    event.preventDefault();
    setNotice(null);
    if (!user) { setNotice({type:'error',message:'Please log in before submitting a post.'}); return; }
    const tags = parseTags(form.tags);
    if (form.title.trim().length < 5) { setNotice({type:'error',message:'Title must contain at least 5 characters.'}); return; }
    if (!tags.length || tags.some((tag) => tag.length < 2)) { setNotice({type:'error',message:'Enter at least one tag. Each tag must have 2 or more characters.'}); return; }
    if (type === 'question' && form.description.trim().length < 20) { setNotice({type:'error',message:'Question description must contain at least 20 characters.'}); return; }
    if (type === 'article' && (form.abstract.trim().length < 20 || form.content.trim().length < 50)) { setNotice({type:'error',message:'Article abstract needs 20 characters and article text needs 50 characters.'}); return; }
    if (form.plan === 'paid' && profile?.subscriptionPlan !== 'paid') { setNotice({type:'error',message:'Only Paid members can publish a Paid-access post. Upgrade your plan first.'}); return; }

    setBusy(true);
    try {
      const token = await user.getIdToken();
      const payload = {
        type, title: form.title.trim(), tags, plan: form.plan,
        ...(type === 'question' ? {description:form.description.trim()} : {abstract:form.abstract.trim(),content:form.content.trim()})
      };
      await apiRequest('/api/posts', { method:'POST', token, body:JSON.stringify(payload) });
      setNotice({type:'success',message:`Your ${type} was saved successfully.`});
      if (type === 'question') setQuestion(initialQuestion); else setArticle(initialArticle);
    } catch (error) { setNotice({type:'error',message:error.message}); }
    finally { setBusy(false); }
  }

  return <main className="content-page narrow-page">
    <div className="page-heading"><span className="eyebrow">CONTRIBUTE TO THE COMMUNITY</span><h1>Create a new post</h1><p>Ask a question or share an article with other learners.</p></div>
    {!user && <div className="inline-warning">You need to <a href="/login">log in</a> before you can publish a post.</div>}
    <Notice notice={notice} onClose={() => setNotice(null)} />
    <section className="panel form-panel">
      <div className="segmented-control" role="group" aria-label="Post type">
        <button className={type==='question'?'selected':''} onClick={() => setType('question')} type="button">Ask a question</button>
        <button className={type==='article'?'selected':''} onClick={() => setType('article')} type="button">Write an article</button>
      </div>
      <form className="form-stack" onSubmit={submit}>
        <label>{type === 'question' ? 'Question title' : 'Article title'}<input value={form.title} onChange={(e)=>change('title',e.target.value)} maxLength="120" required placeholder="Give your post a clear title" /></label>
        {type === 'question' ? <>
          <label>Description<textarea value={form.description} onChange={(e)=>change('description',e.target.value)} minLength="20" maxLength="5000" required rows="6" placeholder="Explain what you need help with…" /></label>
        </> : <>
          <label>Abstract<textarea value={form.abstract} onChange={(e)=>change('abstract',e.target.value)} minLength="20" maxLength="500" required rows="3" placeholder="Summarise your article in a few sentences…" /></label>
          <label>Article text<textarea value={form.content} onChange={(e)=>change('content',e.target.value)} minLength="50" maxLength="20000" required rows="9" placeholder="Write your full article…" /></label>
        </>}
        <label>Tags <span className="label-hint">Separate tags with commas</span><input value={form.tags} onChange={(e)=>change('tags',e.target.value)} required placeholder="react, javascript, study" /></label>
        <label>Who can read this post?
          <select value={form.plan} onChange={(e)=>change('plan',e.target.value)}>
            <option value="free">Free — everyone can read</option>
            {profile?.subscriptionPlan === 'paid' && <option value="paid">Paid — Paid members only</option>}
          </select>
        </label>
        <div className="form-footer"><small>Your post is sent to the secure backend. Your account ID and creation date are recorded automatically.</small><button className="button" disabled={busy || !user}>{busy ? 'Publishing…' : 'Publish post'}</button></div>
      </form>
    </section>
  </main>;
}
