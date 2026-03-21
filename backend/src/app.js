const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const errorHandler = require('./middleware/error.middleware');
const logger = require('./middleware/logger.middleware');

const app = express();

// Security headers — helmet sets sensible defaults automatically.
app.use(helmet());

// Only allow requests from the configured frontend origin.
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Strict rate limit for auth routes to slow down brute-force attempts.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Looser limit for general API usage.
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests, please slow down'
    }
});

// Cap request body size to avoid large payload attacks.
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

app.use(logger);

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/tasks', generalLimiter, taskRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'TaskFlow API is running',
        version: '1.0.0'
    });
});

// Return a proper 404 for any route that doesn't exist.
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handler — must be registered last.
app.use(errorHandler);

module.exports = app;
