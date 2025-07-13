import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    type User
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../config/firebase';
import { AccountLinkingService } from './accountLinkingService';

export const enhancedAuthService = {
    // Enhanced Google sign-in with account linking
    signInWithGoogle: async (): Promise<User> => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.log('Google sign-in error caught:', error);
            AccountLinkingService.logErrorDetails(error);

            if (AccountLinkingService.isAccountExistsError(error)) {
                const linkedUser = await AccountLinkingService.handleAccountExistsError(error);
                if (!linkedUser) {
                    throw new Error('Account linking failed');
                }
                return linkedUser;
            }
            throw error;
        }
    },

    // Enhanced GitHub sign-in with account linking
    signInWithGitHub: async (): Promise<User> => {
        try {
            const result = await signInWithPopup(auth, githubProvider);
            return result.user;
        } catch (error) {
            console.log('GitHub sign-in error caught:', error);
            AccountLinkingService.logErrorDetails(error);

            if (AccountLinkingService.isAccountExistsError(error)) {
                const linkedUser = await AccountLinkingService.handleAccountExistsError(error);
                if (!linkedUser) {
                    throw new Error('Account linking failed');
                }
                return linkedUser;
            }
            throw error;
        }
    },

    // Sign out
    signOut: async (): Promise<void> => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    },

    // Auth state observer
    onAuthStateChanged: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    }
};
