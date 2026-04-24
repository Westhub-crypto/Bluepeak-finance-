// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path'); // Required for serving the public folder

// Initialize Express
const app = express();

// ==========================================
// 🛡️ GLOBAL SECURITY MIDDLEWARE
// ==========================================
// 1. Helmet: Secures HTTP headers (CSP relaxed to allow Tailwind CDN)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// 2. CORS: Controls which domains can access your API
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate Limiter: Prevents brute-force attacks and DDoS
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api/', apiLimiter);

// 4. Body Parser: Allows reading JSON data
// CRITICAL: Webhook must be parsed raw BEFORE the global json parser
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' })); 

// 5. Data Sanitization: Prevents NoSQL Injection
app.use(mongoSanitize());

// 6. Request Logger (Development mode only)
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// ==========================================
// 🔌 API ROUTE IMPORTS
// ==========================================
// Ensure these files exist in your /routes and /controllers folders
const authRoutes = require('./routes/auth_Routes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const investmentRoutes = require('./routes/investmentRoutes');

// ==========================================
// 🛣️ SERVING FRONTEND & ROUTING
// ==========================================
// 1. Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// 2. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/investments', investmentRoutes);

// 3. Catch-all for unknown API endpoints
app.all('/api/*', (req, res) => {
    res.status(404).json({ message: `API Endpoint ${req.originalUrl} not found.` });
});

// 4. Fallback for Frontend Routing
// If a user refreshes /dashboard, Express sends index.html and lets app.js handle it
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// 🗄️ DATABASE CONNECTION & SERVER STARTUP
// ==========================================
const PORT = process.env.PORT || 5000;
const DB_URI = process.env.MONGO_URI;

if (!DB_URI) {
    console.error("CRITICAL ERROR: MONGO_URI is missing from environment variables.");
    process.exit(1);
}

mongoose.connect(DB_URI)
    .then(() => {
        console.log('✅ Secure Vault Connection Established (MongoDB)');
        app.listen(PORT, () => {
            console.log(`🚀 BluePeak Master Engine running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Database Connection Failed:', err.message);
    });
