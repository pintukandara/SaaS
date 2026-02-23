import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { WelcomeDashBoard } from "../../components/Dashboard/WelcomeDashBoard";
import { useUser } from "../../context/UseContext";
import { StatesGrid } from "../../components/Dashboard/StatesGrid";
import Navbar from "../../components/LandingPage/Navbar";
import { Link } from 'react-router-dom';



function EmployeeDashboard() {
  const { user } = useUser();
    const [stats, setStats] = useState({
        myTasks: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        overdue: 0,
    });
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployeeData();
    }, []);

    const fetchEmployeeData = async () => {
        try {
            // Fetch employee's tasks
            const tasksRes = await api.get('/tasks/my_tasks/');
            const myTasks = tasksRes.data;

            setTasks(myTasks);

            // Calculate statistics
            setStats({
                myTasks: myTasks.length,
                completed: myTasks.filter(t => t.status === 'done').length,
                inProgress: myTasks.filter(t => t.status === 'in_progress').length,
                todo: myTasks.filter(t => t.status === 'todo').length,
                overdue: myTasks.filter(t => t.is_overdue).length,
            });
        } catch (error) {
            console.error('Failed to fetch employee data:', error);
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
                    <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <Navbar  />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                                Welcome back, {user?.first_name || user?.username}! 👋
                            </h2>
                            <p className="text-green-100 text-lg">
                                You have {stats.todo + stats.inProgress} tasks in progress
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
                                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    {/* Total Tasks */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">My Tasks</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.myTasks}</p>
                        <p className="text-xs text-gray-500 mt-2">Total assigned</p>
                    </div>

                    {/* To Do */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">To Do</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.todo}</p>
                        <p className="text-xs text-gray-500 mt-2">Not started</p>
                    </div>

                    {/* In Progress */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">In Progress</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.inProgress}</p>
                        <p className="text-xs text-gray-500 mt-2">Working on</p>
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
                        <p className="text-3xl font-bold text-gray-800">{stats.completed}</p>
                        <p className="text-xs text-gray-500 mt-2">Tasks finished</p>
                    </div>

                    {/* Overdue */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-red-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Overdue</h3>
                        <p className="text-3xl font-bold text-gray-800">{stats.overdue}</p>
                        <p className="text-xs text-gray-500 mt-2">Need attention</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Link to="/tasks" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition">View All Tasks</h3>
                                <p className="text-sm text-gray-500">See your complete task list</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/teams" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition">My Teams</h3>
                                <p className="text-sm text-gray-500">View teams you're part of</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/profile" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group">
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition">My Profile</h3>
                                <p className="text-sm text-gray-500">Update your information</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* My Tasks Section */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">My Tasks</h3>
                        <div className="flex space-x-2">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                                All
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
                                Active
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
                                Completed
                            </button>
                        </div>
                    </div>

                    {/* Tasks List */}
                    {tasks.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-block bg-gray-100 p-6 rounded-full mb-4">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                </svg>
                            </div>
                            <h4 className="text-xl font-semibold text-gray-700 mb-2">No tasks assigned yet</h4>
                            <p className="text-gray-500">You'll see your tasks here once they are assigned to you.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tasks.slice(0, 5).map((task) => (
                                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition">
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
                                            className="ml-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                        >
                                            View →
                                        </Link>
                                    </div>
                                </div>
                            ))}

                            {tasks.length > 5 && (
                                <div className="text-center pt-4">
                                    <Link 
                                        to="/tasks"
                                        className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        View All {tasks.length} Tasks
                                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                        </svg>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EmployeeDashboard;
