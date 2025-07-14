import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: {
        firebaseUid: string;
        email: string;
        emailVerified: boolean;
    };
}

export interface ErrorResponse {
    error: string;
    details?: string[];
    stack?: string;
}

export interface HealthCheckResponse {
    status: string;
    timestamp: string;
    environment: string;
}
