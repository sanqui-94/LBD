import {
    signInWithPopup,
    linkWithCredential,
    fetchSignInMethodsForEmail,
    type AuthCredential,
    type User,
    type AuthProvider
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../config/firebase';

// Firebase Auth error structure for account exists error
interface FirebaseAuthErrorWithCredential {
    code: string;
    message: string;
    email?: string; // Email can be at top level
    customData?: {
        email?: string;
        appName?: string;
        phoneNumber?: string;
        tenantId?: string;
    };
    credential?: AuthCredential;
    _tokenResponse?: {
        email?: string;
        verifiedProvider?: string[];
    };
}

export class AccountLinkingService {
    // Handle the account-exists-with-different-credential error
    static async handleAccountExistsError(error: FirebaseAuthErrorWithCredential): Promise<User | null> {
        if (error.code !== 'auth/account-exists-with-different-credential') {
            throw error;
        }

        console.log('Handling account linking...');
        console.log('Full error object:', error);

        // Extract email from multiple possible locations
        const email = error.email ||
            error.customData?.email ||
            error._tokenResponse?.email ||
            (error as any).customData?.email;

        // Extract credential from multiple possible locations
        const pendingCredential = error.credential ||
            (error as any).credential;

        console.log('Extracted email:', email);
        console.log('Extracted credential:', pendingCredential);

        if (!email) {
            console.error('Could not extract email from error object');
            throw new Error('Could not find email in error. Please try signing in with your existing provider first.');
        }

        try {
            // Get existing sign-in methods for this email
            console.log('Fetching sign-in methods for:', email);
            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            console.log('Existing sign-in methods returned:', signInMethods);
            console.log('Sign-in methods length:', signInMethods.length);

            // If fetchSignInMethodsForEmail returns empty, but we have verifiedProvider info,
            // use that as fallback
            let existingProviders = signInMethods;

            if (existingProviders.length === 0 && error._tokenResponse?.verifiedProvider) {
                console.log('Using verifiedProvider as fallback:', error._tokenResponse.verifiedProvider);
                existingProviders = error._tokenResponse.verifiedProvider;
            }

            // If still no providers, infer from the error message or try common providers
            if (existingProviders.length === 0) {
                console.log('No sign-in methods found, inferring from context...');
                // Since this is account-exists-with-different-credential,
                // there must be an existing account. Try Google as it's most common.
                existingProviders = ['google.com'];
                console.log('Defaulting to Google provider');
            }

            console.log('Final providers to try:', existingProviders);

            // Determine which provider the user should sign in with first
            const existingProvider = this.getProviderForSignInMethod(existingProviders[0]);

            if (!existingProvider) {
                throw new Error(`Unknown existing provider: ${existingProviders[0]}`);
            }

            console.log('Signing in with existing provider:', existingProviders[0]);

            // Sign in with the existing provider first
            const result = await signInWithPopup(auth, existingProvider);

            console.log('Signed in with existing provider, now linking...');

            // If we have a credential, try to link it
            if (pendingCredential) {
                try {
                    const linkedUser = await linkWithCredential(result.user, pendingCredential);
                    console.log('Accounts successfully linked!');
                    return linkedUser.user;
                } catch (linkError: any) {
                    console.log('Link error:', linkError);

                    // If already linked, that's actually success
                    if (linkError.code === 'auth/credential-already-in-use' ||
                        linkError.code === 'auth/provider-already-linked') {
                        console.log('Credential already linked - treating as success');
                        return result.user;
                    }

                    // If linking fails for other reasons, user is still signed in
                    console.log('Linking failed but user is signed in:', linkError.message);
                    return result.user;
                }
            } else {
                // If no credential, user is already signed in with the existing provider
                console.log('No credential to link, user signed in with existing provider');
                return result.user;
            }

        } catch (mainError) {
            console.error('Account linking process failed:', mainError);

            // Provide more helpful error messages
            if (mainError instanceof Error) {
                if (mainError.message.includes('popup')) {
                    throw new Error('Popup was blocked. Please allow popups and try again.');
                }
                if (mainError.message.includes('cancelled')) {
                    throw new Error('Sign-in was cancelled. Please try again.');
                }
                if (mainError.message.includes('credential-already-in-use')) {
                    throw new Error('This account is already linked. You can now sign in with either provider.');
                }
            }

            throw mainError;
        }
    }


    private static getProviderForSignInMethod(signInMethod: string): AuthProvider | null {
        switch (signInMethod) {
            case 'google.com':
                return googleProvider;
            case 'github.com':
                return githubProvider;
            default:
                return null;
        }
    }

    // Check if an email already exists with different credentials
    static async checkEmailExists(email: string): Promise<string[]> {
        try {
            return await fetchSignInMethodsForEmail(auth, email);
        } catch (error) {
            console.error('Error checking email:', error);
            return [];
        }
    }

    // Type guard to check if error has the structure we need
    static isAccountExistsError(error: unknown): error is FirebaseAuthErrorWithCredential {
        return (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code: string }).code === 'auth/account-exists-with-different-credential'
        );
    }

    // Enhanced error logging for debugging
    static logErrorDetails(error: unknown): void {
        console.log('=== ERROR DEBUG INFO ===');
        console.log('Error type:', typeof error);
        console.log('Error object:', error);

        if (error && typeof error === 'object') {
            const errorObj = error as any;
            console.log('Error keys:', Object.keys(errorObj));
            console.log('Error code:', errorObj.code);
            console.log('Error message:', errorObj.message);
            console.log('Error email (top level):', errorObj.email);
            console.log('Error customData:', errorObj.customData);
            console.log('Error credential:', errorObj.credential);
            console.log('Error _tokenResponse:', errorObj._tokenResponse);

            // Check if it's a Firebase error with different structure
            if (errorObj.customData) {
                console.log('CustomData keys:', Object.keys(errorObj.customData));
            }

            if (errorObj._tokenResponse) {
                console.log('TokenResponse keys:', Object.keys(errorObj._tokenResponse));
                console.log('Verified providers:', errorObj._tokenResponse.verifiedProvider);
            }
        }
        console.log('=== END ERROR DEBUG ===');
    }
}
