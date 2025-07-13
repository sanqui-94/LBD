import React from 'react';
import styled from 'styled-components';

const LayoutContainer = styled.div`
    min-height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
    padding: 20px;
    position: relative;
    box-sizing: border-box;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
                radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
        pointer-events: none;
    }
`;

const ContentWrapper = styled.div`
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
`;

const LoadingSpinner = styled.div`
    text-align: center;
    color: #475569;
    font-size: 18px;
    font-weight: 500;

    &::after {
        content: '';
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid #cbd5e1;
        border-radius: 50%;
        border-top-color: #ef4444;
        animation: spin 1s ease-in-out infinite;
        margin-left: 12px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;

interface AuthLayoutProps {
    children: React.ReactNode;
    loading?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, loading }) => {
    return (
        <LayoutContainer>
            <ContentWrapper>
                {loading ? (
                    <LoadingSpinner>Getting ready...</LoadingSpinner>
                ) : (
                    children
                )}
            </ContentWrapper>
        </LayoutContainer>
    );
};
