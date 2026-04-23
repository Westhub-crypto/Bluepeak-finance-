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
const authRoutes = require('./routes/auth_Routes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const investmentRoutes = require('./routes/investmentRoutes');

// ==========================================
// 🛣️ SERVING THE FRONTEND & ROUTING
// ==========================================
const path = require('path');

// Tell the server to serve all HTML/CSS/JS files inside the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/investments', investmentRoutes);

// If someone requests an API route that doesn't exist, return a JSON error
app.all('/api/*', (req, res) => {
    res.status(404).json({ message: `API Endpoint not found.` });
});

// For ANY other request, serve the main index.html file (Allows frontend routing to work)
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
