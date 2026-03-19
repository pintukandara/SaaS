import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Only fetch user if authenticated
        const token = localStorage.getItem('access_token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me/');
            setUser(response.data);
        } catch (err) {
            console.error('Failed to fetch user data', err);
            // If token is invalid, clear storage and redirect
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const updateUser = (newUserData) => {
        setUser(newUserData);
    };

    const refreshUser = () => {
        fetchUser();
    };

    const value = {
        user,
        loading,
        updateUser,
        refreshUser,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook to use user context
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within UserProvider');
    }
    return context;
};