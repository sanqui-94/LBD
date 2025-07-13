import React from 'react';
import styled from 'styled-components';
import {useEnhancedAuth} from "../../hooks/useEnhancedAuth.ts";

const ProfileContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 4px 6px -1px rgba(71, 85, 105, 0.1), 0 2px 4px -1px rgba(71, 85, 105, 0.06);
    border: 1px solid #f1f5f9;
`;

const Avatar = styled.img`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3px solid #ef4444;
    object-fit: cover;
`;

const UserInfo = styled.div`
    flex: 1;
`;

const UserName = styled.div`
    font-weight: 600;
    color: #1e293b;
    font-size: 16px;
    margin-bottom: 2px;
`;

const UserEmail = styled.div`
    color: #64748b;
    font-size: 14px;
`;

const SignOutButton = styled.button`
    padding: 8px 16px;
    background: #f1f5f9;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    color: #475569;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #fef2f2;
        border-color: #ef4444;
        color: #dc2626;
    }
`;

const Greeting = styled.div`
    color: #64748b;
    font-size: 12px;
    margin-bottom: 4px;
`;

export const UserProfile: React.FC = () => {
    const { user, signOut } = useEnhancedAuth();

    if (!user) return null;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <ProfileContainer>
            <Avatar src={user.photoURL || '/default-avatar.png'} alt={user.displayName || 'User'} />
            <UserInfo>
                <Greeting>{getGreeting()}!</Greeting>
                <UserName>{user.displayName || 'Friend'}</UserName>
                <UserEmail>{user.email}</UserEmail>
            </UserInfo>
            <SignOutButton onClick={signOut}>
                Sign Out
            </SignOutButton>
        </ProfileContainer>
    );
};
