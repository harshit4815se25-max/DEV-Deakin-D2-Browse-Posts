import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import subscriptionRoutes, {
  stripeWebhook
} from './routes/subscription.js';

const app = express();

// ==========================================
// SERVER CONFIGURATION
// ==========================================

const PORT = Number(process.env.PORT || 5000);

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:5174';

// ==========================================
// CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  FRONTEND_URL
];

const corsOptions = {
  origin: (origin, callback) => {

    // Allow requests without an origin
    // (such as local health checks).

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error('Blocked CORS origin:', origin);

    return callback(
      new Error('Origin not allowed by CORS')
    );
  },

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],

  credentials: true
};

// Apply CORS to all routes.
// This also handles browser preflight requests.

app.use(cors(corsOptions));

// ==========================================
// STRIPE WEBHOOK
// ==========================================

// IMPORTANT:
// Stripe requires the original raw request body.
// Keep this BEFORE express.json().

app.post(
  '/api/subscription/webhook',
  express.raw({
    type: 'application/json'
  }),
  stripeWebhook
);

// ==========================================
// JSON BODY PARSER
// ==========================================

app.use(
  express.json({
    limit: '100kb'
  })
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', (req, res) => {

  return res.status(200).json({
    status: 'success',
    message: 'DEV@Deakin D2 Backend is running.',
    service: 'DEV@Deakin API',
    port: PORT
  });

});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.use('/api/auth', authRoutes);

// ==========================================
// POSTS ROUTES
// ==========================================

app.use('/api/posts', postRoutes);

// ==========================================
// SUBSCRIPTION ROUTES
// ==========================================

app.use(
  '/api/subscription',
  subscriptionRoutes
);

// ==========================================
// UNKNOWN ROUTES
// ==========================================

app.use((req, res) => {

  return res.status(404).json({
    message: 'API endpoint not found.',
    path: req.originalUrl
  });

});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {

  console.error(
    'Backend Error:',
    error.message
  );

  if (res.headersSent) {
    return next(error);
  }

  // CORS errors
  if (error.message === 'Origin not allowed by CORS') {

    return res.status(403).json({
      message: 'Your frontend origin is not allowed.'
    });

  }

  return res.status(500).json({
    message: 'An unexpected server error occurred.'
  });

});

// ==========================================
// START SERVER
// ==========================================

const server = app.listen(PORT, () => {

  console.log('');
  console.log('====================================');
  console.log('     DEV@Deakin D2 Backend');
  console.log('====================================');

  console.log(`Backend:  http://localhost:${PORT}`);

  console.log(`Frontend: ${FRONTEND_URL}`);

  console.log('Allowed Frontend Origins:');

  allowedOrigins.forEach((origin) => {
    console.log(`  - ${origin}`);
  });

  console.log(
    `Health: http://localhost:${PORT}/api/health`
  );

  console.log('====================================');
  console.log('');

});

// ==========================================
// SERVER ERROR HANDLING
// ==========================================

server.on('error', (error) => {

  if (error.code === 'EADDRINUSE') {

    console.error(
      `Port ${PORT} is already in use.`
    );

    console.error(
      'Stop the other backend process and restart.'
    );

  } else {

    console.error(
      'Server startup error:',
      error
    );

  }

  process.exit(1);

});