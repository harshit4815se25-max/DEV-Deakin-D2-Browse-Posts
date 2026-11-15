import { Router } from 'express';
import { db, serverTimestamp } from '../config/firebaseAdmin.js';
import { optionalAuth, requireAuth } from '../middleware/requireAuth.js';

const router = Router();

function validatePost(body, plan) {
  const type = body.type;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const tags = Array.isArray(body.tags) ? body.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean) : [];
  const requestedPlan = body.plan === 'paid' ? 'paid' : 'free';
  if (!['question', 'article'].includes(type)) return 'Choose a valid post type.';
  if (title.length < 5 || title.length > 120) return 'Title must be between 5 and 120 characters.';
  if (!tags.length || tags.length > 8 || tags.some((tag) => tag.length < 2 || tag.length > 24)) return 'Add between 1 and 8 valid tags (2–24 characters each).';
  if (requestedPlan === 'paid' && plan !== 'paid') return 'A Paid membership is required to publish a Paid-access post.';
  if (type === 'question') {
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (description.length < 20 || description.length > 5000) return 'Question description must be between 20 and 5,000 characters.';
  } else {
    const abstract = typeof body.abstract === 'string' ? body.abstract.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (abstract.length < 20 || abstract.length > 500 || content.length < 50 || content.length > 20000) return 'Article abstract must be 20–500 characters and article text 50–20,000 characters.';
  }
  return null;
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    let plan = 'free';
    if (req.user) {
      const userSnapshot = await db.collection('users').doc(req.user.uid).get();
      if (userSnapshot.exists && userSnapshot.data().subscriptionPlan === 'paid') plan = 'paid';
    }
    // Query only the access level the server has authorised for this request.
    const allowedPlans = plan === 'paid' ? ['free', 'paid'] : ['free'];
    const snapshots = await db.collection('posts').where('plan', 'in', allowedPlans).get();
    const posts = snapshots.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        type: data.type,
        title: data.title,
        description: data.description || '',
        abstract: data.abstract || '',
        content: data.content || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        plan: data.plan,
        authorName: data.authorName || 'DEV@Deakin member',
        createdAt: data.createdAt?.toDate?.().toISOString() || ''
      };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return res.json({ posts, access: plan });
  } catch (error) {
    console.error('Browse posts error:', error);
    return res.status(500).json({ message: 'Could not load posts right now.' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const plan = req.profile.subscriptionPlan === 'paid' ? 'paid' : 'free';
    const validationError = validatePost(req.body, plan);
    if (validationError) return res.status(400).json({ message: validationError });

    const type = req.body.type;
    const post = {
      type,
      title: req.body.title.trim(),
      tags: [...new Set(req.body.tags.map((tag) => String(tag).trim().toLowerCase()))],
      plan: req.body.plan === 'paid' ? 'paid' : 'free',
      userId: req.user.uid,
      authorName: String(req.user.name || req.user.email || 'DEV@Deakin member').slice(0, 80),
      createdAt: serverTimestamp()
    };
    if (type === 'question') post.description = req.body.description.trim();
    if (type === 'article') {
      post.abstract = req.body.abstract.trim();
      post.content = req.body.content.trim();
    }

    const reference = await db.collection('posts').add(post);
    return res.status(201).json({ message: 'Post saved successfully.', postId: reference.id });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ message: 'Your post could not be saved. Please try again.' });
  }
});

export default router;
