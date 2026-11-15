import { Router } from 'express';
import Stripe from 'stripe';
import { db, serverTimestamp } from '../config/firebaseAdmin.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
    throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID to backend/.env.');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

router.post('/checkout', requireAuth, async (req, res) => {
  try {
    if (req.profile.subscriptionPlan === 'paid') return res.status(400).json({ message: 'Your account already has a Paid plan.' });
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/pricing?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?payment=cancelled`,
      client_reference_id: req.user.uid,
      metadata: { firebaseUid: req.user.uid }
    });
    return res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return res.status(503).json({ message: error.message || 'Could not start checkout.' });
  }
});

// Stripe must send the raw request body to this endpoint; it is mounted before express.json().
export async function stripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).send('Stripe webhook is not configured.');
  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook signature verification failed: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const uid = session.metadata?.firebaseUid || session.client_reference_id;
    if (uid && session.payment_status === 'paid') {
      await db.collection('users').doc(uid).set({
        subscriptionPlan: 'paid',
        stripeCustomerId: session.customer || null,
        stripeSubscriptionId: session.subscription || null,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const snapshot = await db.collection('users').where('stripeSubscriptionId', '==', subscription.id).limit(1).get();
    if (!snapshot.empty) await snapshot.docs[0].ref.set({ subscriptionPlan: 'free', updatedAt: serverTimestamp() }, { merge: true });
  }
  return res.json({ received: true });
}

export default router;
