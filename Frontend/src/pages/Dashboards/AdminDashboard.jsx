import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../context/UserContext';
import { DashboardNav } from '../../components/Dashboard/DashboardNav';
// import Dashboard from '../Dashboard';

export function AdminDashboard() {
    const { user } = useUser();
    
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalDepartments: 0,
        totalTeams: 0,
        totalProjects: 0,
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
    });
    const [departments, setDepartments] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [topTeams, setTopTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            // Fetch all data in parallel for better performance
            const [
                departmentsRes,
                teamsRes,
                tasksRes,
                projectsRes
            ] = await Promise.all([
                api.get('/departments/'),
                api.get('/teams/'),
                api.get('/tasks/'),
                api.get('/projects/').catch(() => ({ data: [] })) // Handle if projects endpoint doesn't exist yet
            ]);

            const allDepartments = departmentsRes.data;
            const allTeams = teamsRes.data;
            const allTasks = tasksRes.data;
            const allProjects = projectsRes.data;

            setDepartments(allDepartments.slice(0, 4)); // Show top 4 departments
            setTopTeams(allTeams.slice(0, 5)); // Show top 5 teams

            // Calculate total employees (you might need to create this endpoint)
            const totalEmployees = allTeams.reduce((acc, team) => acc + (team.member_count || 0), 0);

            // Calculate task statistics
            const activeTasks = allTasks.filter(t => t.status !== 'done').length;
            const completedTasks = allTasks.filter(t => t.status === 'done').length;
            const overdueTasks = allTasks.filter(t => t.is_overdue).length;

            setStats({
                totalEmployees: totalEmployees,
                totalDepartments: allDepartments.length,
                totalTeams: allTeams.length,
                totalProjects: allProjects.length,
                totalTasks: allTasks.length,
                activeTasks: activeTasks,
                completedTasks: completedTasks,
                overdueTasks: overdueTasks,
            });

            // Create recent activity from recent tasks
            setRecentActivity(allTasks.slice(0, 5));

        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            urgent: 'bg-red-100 text-red-800 border-red-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-green-100 text-green-800 border-green-200',
        };
        return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusColor = (status) => {
        const colors = {
            todo: 'bg-gray-100 text-gray-800',
            in_progress: 'bg-blue-100 text-blue-800',
            review: 'bg-purple-100 text-purple-800',
            done: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-10 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                    
                    <div className="relative flex items-center justify-between">
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                                <span className="text-sm font-semibold uppercase tracking-wide">System Administrator</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                                Admin Dashboard 👑
                            </h2>
                            <p className="text-blue-100 text-lg">
                                Complete system overview and management
                            </p>
                        </div>
                        <div className="hidden md:block">
                            {user?.avatar_url ? (
                                <img 
                                    src={user.avatar_url} 
                                    alt="Profile" 
                                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white">
                                    {user?.first_name?.[0] || user?.username?.[0] || 'A'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Employees */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Employees</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.totalEmployees}</p>
                        <p className="text-xs text-gray-500 mt-2">Across all teams</p>
                    </div>

                    {/* Total Departments */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-purple-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Departments</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.totalDepartments}</p>
                        <p className="text-xs text-gray-500 mt-2">Organizational units</p>
                    </div>

                    {/* Total Teams */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-indigo-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Teams</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.totalTeams}</p>
                        <p className="text-xs text-gray-500 mt-2">Active teams</p>
                    </div>

                    {/* Total Projects */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Projects</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.totalProjects}</p>
                        <p className="text-xs text-gray-500 mt-2">Total projects</p>
                    </div>
                </div>

                {/* Task Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Tasks */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-blue-100 text-sm font-medium">Total Tasks</h3>
                            <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                        <p className="text-4xl font-bold">{stats.totalTasks}</p>
                        <p className="text-xs text-blue-100 mt-1">Company-wide</p>
                    </div>

                    {/* Active Tasks */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-orange-100 text-sm font-medium">Active Tasks</h3>
                            <svg className="w-8 h-8 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <p className="text-4xl font-bold">{stats.activeTasks}</p>
                        <p className="text-xs text-orange-100 mt-1">In progress</p>
                    </div>

                    {/* Completed Tasks */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-green-100 text-sm font-medium">Completed</h3>
                            <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <p className="text-4xl font-bold">{stats.completedTasks}</p>
                        <p className="text-xs text-green-100 mt-1">
                            {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% completion rate
                        </p>
                    </div>

                    {/* Overdue Tasks */}
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md p-6 text-white hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-red-100 text-sm font-medium">Overdue</h3>
                            <svg className="w-8 h-8 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <p className="text-4xl font-bold">{stats.overdueTasks}</p>
                        <p className="text-xs text-red-100 mt-1">Needs attention</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link to="/departments" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition">Add Department</h3>
                                <p className="text-sm text-gray-500">Create new department</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/teams" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition">Create Team</h3>
                                <p className="text-sm text-gray-500">Add new team</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/users" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition">Add Employee</h3>
                                <p className="text-sm text-gray-500">Invite new user</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/reports" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition">View Reports</h3>
                                <p className="text-sm text-gray-500">System analytics</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Departments & Teams Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Departments */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Departments</h3>
                            <Link to="/departments" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                                View All →
                            </Link>
                        </div>

                        {departments.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-block bg-gray-100 p-4 rounded-full mb-4">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                    </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-700 mb-2">No departments yet</h4>
                                <p className="text-gray-500 text-sm mb-4">Create your first department</p>
                                <Link 
                                    to="/departments/create"
                                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    Create Department
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {departments.map((dept) => (
                                    <div key={dept.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-800 mb-1">{dept.name}</h4>
                                                <p className="text-sm text-gray-600 line-clamp-1">{dept.description || 'No description'}</p>
                                            </div>
                                            <div className="ml-4 text-right">
                                                <div className="text-sm text-gray-500">
                                                    <span className="font-semibold text-blue-600">{dept.team_count}</span> teams
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    <span className="font-semibold text-purple-600">{dept.employee_count}</span> employees
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Top Teams */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Teams</h3>
                            <Link to="/teams" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                                View All →
                            </Link>
                        </div>

                        {topTeams.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-block bg-gray-100 p-4 rounded-full mb-4">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                    </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-700 mb-2">No teams yet</h4>
                                <p className="text-gray-500 text-sm mb-4">Create your first team</p>
                                <Link 
                                    to="/teams/create"
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    Create Team
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {topTeams.map((team) => (
                                    <div key={team.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-800 mb-1">{team.name}</h4>
                                                <p className="text-sm text-gray-500">{team.department_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                                                    {team.member_count || 0} members
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">Recent System Activity</h3>
                        <Link to="/tasks" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                            View All Tasks →
                        </Link>
                    </div>

                    {recentActivity.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-block bg-gray-100 p-4 rounded-full mb-4">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-700 mb-2">No activity yet</h4>
                            <p className="text-gray-500">System activity will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentActivity.map((task) => (
                                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition">
                                                    {task.title}
                                                </h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                                                    {task.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-1">
                                                {task.description || 'No description provided'}
                                            </p>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                {task.assigned_to_name && (
                                                    <span className="flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                        </svg>
                                                        {task.assigned_to_name}
                                                    </span>
                                                )}
                                                {task.created_by_name && (
                                                    <span className="flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                                        </svg>
                                                        Created by {task.created_by_name}
                                                    </span>
                                                )}
                                                {task.due_date && (
                                                    <span className={`flex items-center ${task.is_overdue ? 'text-red-600 font-semibold' : ''}`}>
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                        </svg>
                                                        {new Date(task.due_date).toLocaleDateString()}
                                                        {task.is_overdue && ' (Overdue)'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Link 
                                            to={`/tasks/${task.id}`}
                                            className="ml-4 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                        >
                                            View →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;