import { authAdmin, db } from '../config/firebaseAdmin.js';

export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = header.substring(7);

  try {
    const decoded = await authAdmin.verifyIdToken(token);

    req.user = decoded;

    return next();
  } catch (error) {
    console.error('FIREBASE TOKEN ERROR:', error.code, error.message);

    return res.status(401).json({
      message: 'Your session is invalid. Please log in again.',
      errorCode: error.code
    });
  }
}

export async function requireAuth(req, res, next) {
  return optionalAuth(req, res, async () => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Please log in to continue.'
      });
    }

    try {
      const snapshot = await db
        .collection('users')
        .doc(req.user.uid)
        .get();

      req.profile = snapshot.exists
        ? snapshot.data()
        : { subscriptionPlan: 'free' };

      return next();
    } catch (error) {
      console.error('PROFILE ERROR:', error);

      return res.status(500).json({
        message: 'Could not verify your account.'
      });
    }
  });
}