import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../context/UserContext';
import { DashboardNav } from '../../components/Dashboard/DashboardNav';

export function ManagerDashboard() {
    const { user } = useUser();
    
    const [stats, setStats] = useState({
        myTeams: 0,
        teamMembers: 0,
        teamTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        teamProjects: 0,
    });
    const [teams, setTeams] = useState([]);
    const [recentTasks, setRecentTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchManagerData();
    }, []);

    const fetchManagerData = async () => {
        try {
            // Fetch manager's teams
            const teamsRes = await api.get('/teams/my_teams/');
            const myTeams = teamsRes.data;
            setTeams(myTeams);

            // Calculate total team members
            const totalMembers = myTeams.reduce((acc, team) => acc + team.member_count, 0);

            // Fetch tasks for manager's teams
            const tasksRes = await api.get('/tasks/?manager=true'); // You might need to adjust this endpoint
            const teamTasks = tasksRes.data;
            setRecentTasks(teamTasks.slice(0, 5)); // Show recent 5 tasks

            // Calculate statistics
            setStats({
                myTeams: myTeams.length,
                teamMembers: totalMembers,
                teamTasks: teamTasks.length,
                completedTasks: teamTasks.filter(t => t.status === 'done').length,
                overdueTasks: teamTasks.filter(t => t.is_overdue).length,
                teamProjects: 0, // You can add project count here
            });

        } catch (error) {
            console.error('Failed to fetch manager data:', error);
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
                    <svg className="animate-spin h-12 w-12 text-purple-600 mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 font-medium">Loading manager dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav/>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                                Manager Dashboard 📊
                            </h2>
                            <p className="text-purple-100 text-lg">
                                Welcome back, {user?.first_name || user?.username}! You manage {stats.myTeams} team{stats.myTeams !== 1 ? 's' : ''}
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
                                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl font-bold">
                                    {user?.first_name?.[0] || user?.username?.[0] || 'M'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* My Teams */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">My Teams</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.myTeams}</p>
                        <p className="text-xs text-gray-500 mt-2">Teams you manage</p>
                    </div>

                    {/* Team Members */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Team Members</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.teamMembers}</p>
                        <p className="text-xs text-gray-500 mt-2">People in your teams</p>
                    </div>

                    {/* Team Tasks */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Team Tasks</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.teamTasks}</p>
                        <p className="text-xs text-gray-500 mt-2">Total team workload</p>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Completion Rate</h3>
                        <p className="text-3xl font-bold text-gray-800">
                            {stats.teamTasks > 0 ? Math.round((stats.completedTasks / stats.teamTasks) * 100) : 0}%
                        </p>
                        <p className="text-xs text-gray-500 mt-2">{stats.completedTasks} of {stats.teamTasks} tasks</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Link to="/tasks/create" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition">Assign Task</h3>
                                <p className="text-sm text-gray-500">Create new task</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/teams" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition">My Teams</h3>
                                <p className="text-sm text-gray-500">Manage teams</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/projects" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition">Projects</h3>
                                <p className="text-sm text-gray-500">View all projects</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/reports/team" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition">Reports</h3>
                                <p className="text-sm text-gray-500">Team analytics</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* My Teams Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Teams Overview */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">My Teams</h3>
                            <Link to="/teams" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                                View All →
                            </Link>
                        </div>

                        {teams.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-block bg-gray-100 p-4 rounded-full mb-4">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                    </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-700 mb-2">No teams assigned</h4>
                                <p className="text-gray-500 text-sm">You haven't been assigned as a manager to any teams yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {teams.slice(0, 3).map((team) => (
                                    <div key={team.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-800 mb-1">{team.name}</h4>
                                                <p className="text-sm text-gray-500">{team.department_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-semibold">
                                                    {team.member_count} members
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Performance Overview */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Team Performance</h3>
                        <div className="space-y-4">
                            {/* Completion Progress */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Task Completion</span>
                                    <span className="text-sm font-semibold text-gray-800">
                                        {stats.teamTasks > 0 ? Math.round((stats.completedTasks / stats.teamTasks) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${stats.teamTasks > 0 ? (stats.completedTasks / stats.teamTasks) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Stats Breakdown */}
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Active Tasks</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.teamTasks - stats.completedTasks}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Overdue</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.overdueTasks}</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Team Size</p>
                                    <p className="text-2xl font-bold text-purple-600">{stats.teamMembers}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Team Tasks */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">Recent Team Tasks</h3>
                        <Link to="/tasks" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                            View All →
                        </Link>
                    </div>

                    {recentTasks.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-block bg-gray-100 p-4 rounded-full mb-4">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-700 mb-2">No team tasks yet</h4>
                            <p className="text-gray-500 text-sm mb-4">Create your first task to get started</p>
                            <Link 
                                to="/tasks/create"
                                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Create Task
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentTasks.map((task) => (
                                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="text-lg font-semibold text-gray-800 group-hover:text-purple-600 transition">
                                                    {task.title}
                                                </h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                                                    {task.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
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
                                                {task.project_name && (
                                                    <span className="flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                                                        </svg>
                                                        {task.project_name}
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
                                            className="ml-4 text-purple-600 hover:text-purple-800 font-medium text-sm"
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

export default ManagerDashboard;