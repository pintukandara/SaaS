import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { logout } from '../utils/auth';

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
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                TaskFlow
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Navigation Links */}
                            <Link
                                to="/dashboard"
                                className={`font-medium transition ${
                                    location.pathname === '/dashboard' 
                                        ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' 
                                        : 'text-gray-700 hover:text-indigo-600'
                                }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/teams"
                                className={`font-medium transition ${
                                    location.pathname === '/teams' 
                                        ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' 
                                        : 'text-gray-700 hover:text-indigo-600'
                                }`}
                            >
                                Teams
                            </Link>

                            {/* User Info */}
                            <div className="hidden sm:flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                    {user?.first_name || user?.username}
                                </span>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center space-x-2 shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
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
                                Welcome back, {user?.first_name || user?.username}! 👋
                            </h2>
                            <p className="text-indigo-100 text-lg">
                                Role: <span className="font-semibold capitalize">{user?.role}</span> • {user?.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Tasks */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Tasks</h3>
                        <p className="text-3xl font-bold text-gray-800">0</p>
                        <p className="text-xs text-gray-500 mt-2">All assigned tasks</p>
                    </div>

                    {/* Completed */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Completed</h3>
                        <p className="text-3xl font-bold text-gray-800">0</p>
                        <p className="text-xs text-gray-500 mt-2">Tasks finished</p>
                    </div>

                    {/* In Progress */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">In Progress</h3>
                        <p className="text-3xl font-bold text-gray-800">0</p>
                        <p className="text-xs text-gray-500 mt-2">Currently working on</p>
                    </div>

                    {/* Pending */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Pending</h3>
                        <p className="text-3xl font-bold text-gray-800">0</p>
                        <p className="text-xs text-gray-500 mt-2">Awaiting action</p>
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">Your Tasks</h3>
                        <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition flex items-center space-x-2 shadow-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            <span>New Task</span>
                        </button>
                    </div>

                    {/* Empty State */}
                    <div className="text-center py-16">
                        <div className="inline-block bg-gray-100 p-6 rounded-full mb-4">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                            </svg>
                        </div>
                        <h4 className="text-xl font-semibold text-gray-700 mb-2">No tasks yet</h4>
                        <p className="text-gray-500 mb-6">Create your first task to get started!</p>
                        <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-sm">
                            Create Your First Task
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">Create Task</h4>
                                <p className="text-sm text-gray-500">Add a new task</p>
                            </div>
                        </div>
                    </div>

                    <Link to="/teams" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">View Teams</h4>
                                <p className="text-sm text-gray-500">Manage your teams</p>
                            </div>
                        </div>
                    </Link>

                    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">View Reports</h4>
                                <p className="text-sm text-gray-500">Analytics & stats</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;