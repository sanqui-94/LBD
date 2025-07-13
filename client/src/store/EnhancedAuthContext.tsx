import React, { createContext, useEffect, useState } from 'react';
import { type User } from 'firebase/auth';
import { enhancedAuthService } from '../services/enhancedAuthService';

interface EnhancedAuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithGitHub: () => Promise<void>;
    signOut: () => Promise<void>;
    error: string | null;
}

// eslint-disable-next-line react-refresh/only-export-components
export const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);


export const EnhancedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = enhancedAuthService.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        try {
            setError(null);
            setLoading(true);
            await enhancedAuthService.signInWithGoogle();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
            setError(errorMessage);
            console.error('Google sign in error:', error);
        } finally {
            setLoading(false);
        }
    };

    const signInWithGitHub = async () => {
        try {
            setError(null);
            setLoading(true);
            await enhancedAuthService.signInWithGitHub();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'GitHub sign in failed';
            setError(errorMessage);
            console.error('GitHub sign in error:', error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setError(null);
            await enhancedAuthService.signOut();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
            setError(errorMessage);
            console.error('Sign out error:', error);
        }
    };

    const value = {
        user,
        loading,
        signInWithGoogle,
        signInWithGitHub,
        signOut,
        error,
    };

    return <EnhancedAuthContext.Provider value={value}>{children}</EnhancedAuthContext.Provider>;
};
