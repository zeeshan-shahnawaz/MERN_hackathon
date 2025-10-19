const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Set required environment variables if not already set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'healthmate_super_secret_jwt_key_2024_development_only';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || '12';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBMZvbMBAmJ2779tTXfGY-4gcBB2C31fVw';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY  || '358961999656811';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dvju9f84v';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'xbDaFwutZMuLasCO2Jitba0SBQI';

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const fileRoutes = require('./routes/file');
const insightRoutes = require('./routes/insight');
const vitalsRoutes = require('./routes/vitals');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'HealthMate Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/vitals', vitalsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Database connection
const MONGO_URI = 'mongodb+srv://sheikhyahyakhan65_db_user:diexeDbWKJlGHaNn@health-management.atlzogz.mongodb.net/?retryWrites=true&w=majority&appName=health-management';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 HealthMate Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
