import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AdminDashboard from './Dashboards/AdminDashboard';
import ManagerDashboard from './Dashboards/ManagerDashboard';
import EmployeeDashboard from './Dashboards/EmployeeDashboard';

function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    // Route to appropriate dashboard based on role
    switch (user?.role) {
        case 'admin':
            return <Dashboard user={user} />;
        case 'manager':
            return <ManagerDashboard user={user} />;
        case 'employee':
            return <EmployeeDashboard user={user} />;
        default:
            return <EmployeeDashboard user={user} />;
    }
}

export default Dashboard;