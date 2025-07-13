import React from 'react';
import { useEnhancedAuth } from '../../hooks/useEnhancedAuth';
import { LoginForm } from './LoginForm';
import { UserProfile } from './UserProfile';
import { AuthLayout } from './AuthLayout';
import { AccountLinkingModal } from './AccountLinkingModal';

export const AuthContainer: React.FC = () => {
    const {
        user,
        loading,
        showLinkingModal,
        linkingData,
        confirmAccountLinking,
        cancelAccountLinking
    } = useEnhancedAuth();

    const getProviderName = (provider: string) => {
        switch (provider) {
            case 'google.com': return 'Google';
            case 'github.com': return 'GitHub';
            default: return provider;
        }
    };

    return (
        <>
            <AuthLayout loading={loading}>
                {!loading && (user ? <UserProfile /> : <LoginForm />)}
            </AuthLayout>

            {/* Account Linking Modal */}
            <AccountLinkingModal
                isOpen={showLinkingModal}
                existingProvider={linkingData ? getProviderName(linkingData.existingProvider) : ''}
                onConfirm={confirmAccountLinking}
                onCancel={cancelAccountLinking}
            />
        </>
    );
};
