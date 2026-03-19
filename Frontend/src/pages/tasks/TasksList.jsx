import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../context/UserContext';
import { DashboardNav } from '../../components/Dashboard/DashboardNav';


function TasksList() {
    const { user } = useUser();
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        search: '',
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, tasks]);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks/');
            setTasks(response.data);
            setFilteredTasks(response.data);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...tasks];

        // Filter by status
        if (filters.status !== 'all') {
            filtered = filtered.filter(task => task.status === filters.status);
        }

        // Filter by priority
        if (filters.priority !== 'all') {
            filtered = filtered.filter(task => task.priority === filters.priority);
        }

        // Filter by search
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchLower) ||
                (task.description && task.description.toLowerCase().includes(searchLower))
            );
        }

        setFilteredTasks(filtered);
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
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
            <div className="min-h-screen bg-gray-50">
                <DashboardNav />
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-gray-600">Loading tasks...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
                        <p className="text-gray-600 mt-1">Manage and track all your tasks</p>
                    </div>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <Link
                            to="/tasks/create"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center shadow-md"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Create Task
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Search tasks..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">In Review</option>
                                <option value="done">Done</option>
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Priority
                            </label>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange('priority', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="all">All Priorities</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tasks Count */}
                <div className="mb-4">
                    <p className="text-gray-600">
                        Showing <span className="font-semibold text-gray-900">{filteredTasks.length}</span> of{' '}
                        <span className="font-semibold text-gray-900">{tasks.length}</span> tasks
                    </p>
                </div>

                {/* Tasks List */}
                {filteredTasks.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <div className="inline-block bg-gray-100 p-6 rounded-full mb-4">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks found</h3>
                        <p className="text-gray-500 mb-6">
                            {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Create your first task to get started'}
                        </p>
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                            <Link
                                to="/tasks/create"
                                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Create Task
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <h3 className="text-xl font-semibold text-gray-800 group-hover:text-indigo-600 transition">
                                                {task.title}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                                                {task.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                                                {task.priority.toUpperCase()}
                                            </span>
                                            {task.is_overdue && (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                    OVERDUE
                                                </span>
                                            )}
                                        </div>

                                        {task.description && (
                                            <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
                                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                            {task.estimated_hours && (
                                                <span className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    {task.estimated_hours}h
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <Link
                                        to={`/tasks/${task.id}`}
                                        className="ml-6 text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                                    >
                                        View
                                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TasksList;