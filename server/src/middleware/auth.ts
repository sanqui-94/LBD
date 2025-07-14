import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';
import { AuthenticatedRequest } from '../types';

export const authenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void | Response> => {
    try {
        console.log('🔍 Auth middleware - Headers:', req.headers.authorization);

        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        console.log('🔍 Auth middleware - Token extracted:', token ? 'Present' : 'Missing');

        if (!token) {
            console.log('❌ Auth middleware - No token provided');
            return res.status(401).json({ error: 'No token provided' });
        }

        console.log('🔍 Auth middleware - Verifying token with Firebase...');
        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('✅ Auth middleware - Token verified:', decodedToken.uid);

        req.user = {
            firebaseUid: decodedToken.uid,
            email: decodedToken.email || '',
            emailVerified: decodedToken.email_verified || false
        };

        console.log('✅ Auth middleware - User set:', req.user);
        next();
    } catch (error) {
        console.error('❌ Auth middleware - Token verification failed:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};


export const optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.user = {
                firebaseUid: decodedToken.uid,
                email: decodedToken.email || '',
                emailVerified: decodedToken.email_verified || false
            };
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};
