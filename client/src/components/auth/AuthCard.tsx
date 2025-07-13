import React from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
    background: white;
    border-radius: 24px;
    padding: 40px 32px;
    box-shadow: 0 10px 25px -5px rgba(71, 85, 105, 0.1), 0 4px 6px -2px rgba(71, 85, 105, 0.05);
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    border: 1px solid #f1f5f9;
`;

const Title = styled.h1`
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    text-align: center;
    margin-bottom: 8px;
    letter-spacing: -0.025em;
`;

const Subtitle = styled.p`
    font-size: 16px;
    color: #64748b;
    text-align: center;
    margin-bottom: 32px;
    line-height: 1.6;
`;

const ButtonGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const WelcomeText = styled.div`
    text-align: center;
    margin-bottom: 24px;

    .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 16px;
        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
    }

    .icon {
        font-size: 10px;
    }
`;

interface AuthCardProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    showWelcome?: boolean;
}

export const AuthCard: React.FC<AuthCardProps> = ({
                                                      title,
                                                      subtitle,
                                                      children,
                                                      showWelcome = true
                                                  }) => {
    return (
        <CardContainer>
            {showWelcome && (
                <WelcomeText>
                    <div className="badge">
                        <span className="icon">✓</span>
                        Verified Local Recommendations
                    </div>
                </WelcomeText>
            )}
            <Title>{title}</Title>
            <Subtitle>{subtitle}</Subtitle>
            <ButtonGroup>
                {children}
            </ButtonGroup>
        </CardContainer>
    );
};
