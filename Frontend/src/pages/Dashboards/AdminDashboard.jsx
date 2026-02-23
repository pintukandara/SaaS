import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { logout } from '../../utils/auth';
import { DashboardNav } from '../../components/Dashboard/DashboardNav';
import { WelcomeDashBoard } from '../../components/Dashboard/WelcomeDashBoard';
import { StatesGrid } from '../../components/Dashboard/StatesGrid';
import { TaskSection } from '../../components/Dashboard/TaskSection';
import { QuickActions } from '../../components/Dashboard/QuickActions';

function Dashboard() {
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }
    

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <DashboardNav/>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <WelcomeDashBoard/>

                {/* Stats Grid */}
                <StatesGrid/>
                
                {/* Tasks Section */}
                <TaskSection/>
               
                

                {/* Quick Actions */}
                <QuickActions/>

            </div>
        </div>
    );
}

export default Dashboard;