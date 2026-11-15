import { Router } from 'express';
import { db, serverTimestamp } from '../config/firebaseAdmin.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.post('/sync', requireAuth, async (req, res) => {
  const displayName = String(req.body.displayName || req.user.name || '').trim().slice(0, 80);
  const ref = db.collection('users').doc(req.user.uid);
  const snapshot = await ref.get();
  const existing = snapshot.exists ? snapshot.data() : {};
  const user = {
    uid: req.user.uid,
    email: req.user.email || '',
    displayName: displayName || existing.displayName || '',
    subscriptionPlan: existing.subscriptionPlan === 'paid' ? 'paid' : 'free',
    createdAt: existing.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await ref.set(user, { merge: true });
  const saved = await ref.get();
  return res.json({ user: { ...saved.data(), createdAt: saved.data().createdAt?.toDate?.().toISOString() || null } });
});

router.get('/me', requireAuth, async (req, res) => {
  const snapshot = await db.collection('users').doc(req.user.uid).get();
  const user = snapshot.exists ? snapshot.data() : {
    uid: req.user.uid, email: req.user.email || '', displayName: req.user.name || '', subscriptionPlan: 'free'
  };
  return res.json({ user: { ...user, createdAt: user.createdAt?.toDate?.().toISOString() || null } });
});

export default router;
