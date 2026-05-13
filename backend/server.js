require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Initialize App
const app = express();

// Rate Limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per IP
    message: 'Too many requests from this IP, please try again later'
});

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again in a minute'
});

// Connect to Database
connectDB().then(() => {
    const { checkExpiringProducts } = require('./utils/expiryCheck');
    checkExpiringProducts();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false // Disable for dev, enable with config in production
}));
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));
app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to MY SHOP API' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
