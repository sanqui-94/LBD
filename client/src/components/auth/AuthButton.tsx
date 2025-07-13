import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    padding: 16px 24px;
    border: 2px solid #e2e8f0;
    border-radius: 24px;
    background: white;
    color: #475569;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(71, 85, 105, 0.08);

    &:hover {
        border-color: #ef4444;
        background: #fef2f2;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
        color: #374151;
    }

    &:active {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 20px;
    height: 20px;
`;

interface AuthButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
                                                          onClick,
                                                          children,
                                                          icon,
                                                          disabled
                                                      }) => {
    return (
        <StyledButton onClick={onClick} disabled={disabled}>
            {icon && <IconWrapper>{icon}</IconWrapper>}
            {children}
        </StyledButton>
    );
};
