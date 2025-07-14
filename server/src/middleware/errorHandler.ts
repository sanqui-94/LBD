import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { ErrorResponse } from '../types';

interface MongoError extends Error {
    code?: number;
    keyValue?: Record<string, any>;
    status?: number;
}

interface ValidationError extends MongooseError {
    errors: Record<string, { message: string }>;
}

export const errorHandler = (
    err: MongoError,
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const validationErr = err as unknown as ValidationError;
        const errors = Object.values(validationErr.errors).map(e => e.message);
        return res.status(400).json({
            error: 'Validation Error',
            details: errors
        } as ErrorResponse);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
        return res.status(400).json({
            error: 'Duplicate Error',
            details: [`${field} already exists`]
        } as ErrorResponse);
    }

    // Mongoose cast error
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format'
        } as ErrorResponse);
    }

    // Default error
    const response: ErrorResponse = {
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    return res.status(err.status || 500).json(response);
};
