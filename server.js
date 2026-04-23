// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Initialize Express
const app = express();

// ==========================================
// 🛡️ GLOBAL SECURITY MIDDLEWARE
// ==========================================
// 1. Helmet: Secures HTTP headers
app.use(helmet());

// 2. CORS: Controls which domains can access your API
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Update this to your actual frontend domain in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate Limiter: Prevents brute-force attacks and DDoS
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api/', apiLimiter);

// 4. Body Parser: Allows reading JSON data (crucial for webhooks)
// Note: We use express.raw for the Squad webhook route specifically, but express.json for others.
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' })); // Limits payload size to prevent crashing

// 5. Data Sanitization: Prevents NoSQL Injection
app.use(mongoSanitize());

// 6. Request Logger (Development mode only)
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// ==========================================
// 🔌 ROUTE IMPORTS
// ==========================================
const authRoutes = require('./routes/auth_routes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminroutes');
const investmentRoutes = require('./routes/investmentRoutes');

// ==========================================
// 🛣️ MOUNTING ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/investments', investmentRoutes);

// Health Check Route (Used by hosting providers to ensure server is alive)
app.get('/', (req, res) => {
    res.status(200).json({ status: 'active', message: 'BluePeak Finance Engine Online' });
});

// Fallback Route for undefined endpoints
app.all('*', (req, res) => {
    res.status(404).json({ message: `Cannot find ${req.originalUrl} on this server.` });
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
