const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Added to handle file paths
require('dotenv').config();

const app = express();

// 1. MIDDLEWARE
app.use(express.json());
app.use(cors());

// 2. SERVE FRONTEND FILES
// This tells the server to look in the 'public' folder for index.html and app.js
app.use(express.static(path.join(__dirname, 'public')));

// 3. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('BluePeak Database Connected Successfully'))
  .catch((err) => console.log('DB Connection Error:', err));

// 4. ROUTE IMPORTS
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// 5. API ENDPOINTS
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/webhooks', webhookRoutes);

// 6. SERVE THE UI ON THE HOME PAGE
// Instead of plain text, this sends your beautiful HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 7. SERVER START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`BluePeak Server is running on port ${PORT}`);
});
