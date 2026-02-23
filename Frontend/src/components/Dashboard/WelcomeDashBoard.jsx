import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { logout } from '../../utils/auth';

export const WelcomeDashBoard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await api.get('/auth/me/');
            setUser(response.data);
        } catch (err) {
            console.error('Failed to fetch user data', err);
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };
  return (
    <>
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
                    <div className="flex items-center space-x-4">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt="User Avatar"
                                className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl font-bold">
                                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                            </div>
                        )}
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                                Welcome back, {user?.first_name || user?.username}! 
                            </h2>
                            <p className="text-indigo-100 text-lg">
                                Role: <span className="font-semibold capitalize">{user?.role}</span> • {user?.email}
                            </p>
                        </div>
                    </div>
                </div>
    </>
  )
}
