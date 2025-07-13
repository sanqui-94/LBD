import {signInWithPopup, onAuthStateChanged, type User} from "firebase/auth";

import {auth, githubProvider, googleProvider} from "../config/firebase.ts";

export const authService = {
    singInWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
        }
    },
    signInWithGithub: async () => {
        try {
            const result = await signInWithPopup(auth, githubProvider);
            return result.user;
        } catch (error) {
            console.error('GitHub sign in error:', error);
            throw error;
        }
    },
    signOut: async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    },
    onAuthStateChanged: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    }
}
