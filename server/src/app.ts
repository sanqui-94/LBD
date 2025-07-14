import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import configurations
import connectDB from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { HealthCheckResponse } from './types';

import { User } from './models/User';
import onboardingRoutes from './routes/onboarding';
// Import routes (we'll create these next)
// import userRoutes from './routes/users';
// import onboardingRoutes from './routes/onboarding';


console.log('🔍 Environment Debug:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current working directory:', process.cwd());


console.log('🔥 Importing Firebase config...');
import admin from './config/firebase';
console.log('🔥 Firebase import completed');

// Test Firebase is working
console.log('🧪 Testing Firebase Admin...');
try {
    const app = admin.app();
    console.log('✅ Firebase Admin app available:', app.name);
    console.log('✅ Firebase Project ID:', app.options.projectId);
} catch (error) {
    console.error('❌ Firebase Admin test failed:', error);
}

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Connect to Database
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('combined')); // Logging

// CORS configuration
const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

app.use(cors({
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    const response: HealthCheckResponse = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    };
    res.json(response);
});

app.get('/api/test', (req: Request, res: Response) => {
    console.log("Simple test endpoint hit");
    res.json(
        {
            message: 'Hello from LBD server!',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            server: "TypeScript Express Server",
        }
    );
});

app.get('/api/test/params/:id', (req: Request, res: Response) => {
    console.log('Params test endpoint hit with ID:', req.params.id);
    res.json({
        message: 'Parameter test successful',
        receivedId: req.params.id,
        type: typeof req.params.id
    });
});

app.post('/api/test/body', (req: Request, res: Response) => {
    console.log('Body test endpoint hit with data:', req.body);
    res.json({
        message: 'Body parsing test successful',
        receivedData: req.body,
        headers: {
            contentType: req.get('Content-Type'),
            userAgent: req.get('User-Agent')
        }
    });
});

app.get('/api/test/database', async (req: Request, res: Response) => {
    console.log('📝 Database test endpoint hit');
    try {
        // Test MongoDB connection
        const mongoose = require('mongoose');
        const dbState = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        res.json({
            message: 'Database connection test',
            mongodb: {
                state: states[dbState as keyof typeof states],
                host: mongoose.connection.host,
                name: mongoose.connection.name
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Database test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.get('/api/test/user-model', async (req: Request, res: Response) => {
    console.log('📝 User model test endpoint hit');
    try {
        // Test creating a user with minimal data
        const testUser = new User({
            firebaseUid: 'test_uid_' + Date.now(),
            profile: {
                email: `test${Date.now()}@example.com`,
                preferredLanguage: 'es',
                country: 'BO'
            }
        });

        // Validate without saving
        await testUser.validate();

        res.json({
            message: 'User model validation successful',
            user: {
                firebaseUid: testUser.firebaseUid,
                email: testUser.profile.email,
                onboarding: testUser.onboarding,
                location: testUser.location,
                preferences: testUser.preferences
            }
        });
    } catch (error) {
        console.error('User model test error:', error);
        res.status(500).json({
            message: 'User model test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// API Routes logging middleware
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Routes (uncomment as you create them)
// app.use('/api/users', userRoutes);
// app.use('/api/onboarding', onboardingRoutes);
app.use('/api/onboarding', onboardingRoutes);


// 404 handler for API routes
app.use('/api/*splat', (req: Request, res: Response) => {
    res.status(404).json({
        error: 'API route not found',
        path: req.originalUrl
    });
});

// General 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

export default app;
