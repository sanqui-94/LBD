import { useContext } from 'react';
import { EnhancedAuthContext } from '../store/EnhancedAuthContext';

export const useEnhancedAuth = () => {
    const context = useContext(EnhancedAuthContext);
    if (!context) {
        throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
    }
    return context;
};
