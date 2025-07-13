import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background: white;
    border-radius: 16px;
    padding: 32px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
    color: #1e293b;
    margin-bottom: 16px;
    font-size: 20px;
`;

const ModalText = styled.p`
    color: #64748b;
    line-height: 1.6;
    margin-bottom: 24px;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    justify-content: flex-end;
`;

const Button = styled.button<{ primary?: boolean }>`
    padding: 10px 20px;
    border-radius: 8px;
    border: 2px solid ${props => props.primary ? '#ef4444' : '#e2e8f0'};
    background: ${props => props.primary ? '#ef4444' : 'white'};
    color: ${props => props.primary ? 'white' : '#475569'};
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background: ${props => props.primary ? '#dc2626' : '#f8f9fa'};
    }
`;

interface AccountLinkingModalProps {
    isOpen: boolean;
    existingProvider: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const AccountLinkingModal: React.FC<AccountLinkingModalProps> = ({
                                                                            isOpen,
                                                                            existingProvider,
                                                                            onConfirm,
                                                                            onCancel
                                                                        }) => {
    if (!isOpen) return null;

    const getProviderName = (provider: string) => {
        switch (provider) {
            case 'google.com': return 'Google';
            case 'github.com': return 'GitHub';
            default: return provider;
        }
    };

    return (
        <ModalOverlay>
            <ModalContent>
                <ModalTitle>Link Your Accounts</ModalTitle>
                <ModalText>
                    This email is already associated with a {getProviderName(existingProvider)} account.
                    Would you like to link your accounts so you can sign in with either provider?
                </ModalText>
                <ButtonGroup>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button primary onClick={onConfirm}>Link Accounts</Button>
                </ButtonGroup>
            </ModalContent>
        </ModalOverlay>
    );
};
