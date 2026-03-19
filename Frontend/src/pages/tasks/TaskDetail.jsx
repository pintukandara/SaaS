import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../context/UserContext';
import { DashboardNav } from '../../components/Dashboard/DashboardNav';

function TaskDetail() {
    const { id } = useParams();
    const { user } = useUser();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Comment state
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // Edit form state
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        status: '',
        priority: '',
        assigned_to: '',
        due_date: '',
        estimated_hours: '',
        tags: '',
    });

    useEffect(() => {
        fetchTaskDetail();
    }, [id]);

    const fetchTaskDetail = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/tasks/${id}/`);
            setTask(response.data);
            
            // Initialize edit form with task data
            setEditFormData({
                title: response.data.title || '',
                description: response.data.description || '',
                status: response.data.status || '',
                priority: response.data.priority || '',
                assigned_to: response.data.assigned_to || '',
                due_date: response.data.due_date ? response.data.due_date.slice(0, 16) : '', // Format for datetime-local
                estimated_hours: response.data.estimated_hours || '',
                tags: response.data.tags || '',
            });
        } catch (error) {
            console.error('Failed to fetch task:', error);
            setError('Failed to load task details');
        } finally {
            setLoading(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.patch(`/tasks/${id}/update_status/`, {
                status: newStatus
            });
            setTask(response.data);
            setSuccess('Status updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to update status:', err);
            setError('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.put(`/tasks/${id}/`, editFormData);
            setTask(response.data);
            setIsEditing(false);
            setSuccess('Task updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to update task:', err);
            setError(err.response?.data?.detail || 'Failed to update task');
        } finally {
            setUpdating(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        setError('');

        try {
            const response = await api.post(`/tasks/${id}/add_comment/`, {
                text: commentText
            });
            
            // Add new comment to task
            setTask(prev => ({
                ...prev,
                comments: [...(prev.comments || []), response.data]
            }));
            
            setCommentText('');
            setSuccess('Comment added!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to add comment:', err);
            setError('Failed to add comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            return;
        }

        setUpdating(true);
        try {
            await api.delete(`/tasks/${id}/`);
            navigate('/tasks');
        } catch (err) {
            console.error('Failed to delete task:', err);
            setError('Failed to delete task. You may not have permission.');
            setUpdating(false);
        }
    };

    const canEdit = () => {
        if (!user || !task) return false;
        return user.role === 'admin' || 
               (user.role === 'manager' && task.created_by === user.id);
    };

    const canDelete = () => {
        if (!user || !task) return false;
        return user.role === 'admin' || 
               (user.role === 'manager' && task.created_by === user.id);
    };

    const canUpdateStatus = () => {
        if (!user || !task) return false;
        // Employee can update status of their own tasks
        // Manager and Admin can update any task
        return task.assigned_to === user.id || user.role === 'manager' || user.role === 'admin';
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
                    <div className="flex flex-col items-center">
                        <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-600 font-medium">Loading task details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-screen bg-gray-50">
                <DashboardNav />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Task not found</h3>
                        <Link to="/tasks" className="text-indigo-600 hover:text-indigo-700 font-medium">
                            ← Back to tasks
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        to="/tasks"
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back to Tasks
                    </Link>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                            <p className="text-green-700 font-medium">{success}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                            </svg>
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Task Header */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            {!isEditing ? (
                                <>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h1 className="text-3xl font-bold text-gray-900 mb-3">{task.title}</h1>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(task.status)}`}>
                                                    {task.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                                {task.is_overdue && (
                                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                                                        OVERDUE
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            {canEdit() && (
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    title="Edit task"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                            {canDelete() && (
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={updating}
                                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                                    title="Delete task"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {task.description && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                                            <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {task.tags && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {task.tags.split(',').map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                                    >
                                                        {tag.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Edit Form */
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={editFormData.title}
                                            onChange={handleEditChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={editFormData.description}
                                            onChange={handleEditChange}
                                            rows="4"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                                        ></textarea>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={editFormData.status}
                                                onChange={handleEditChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="review">In Review</option>
                                                <option value="done">Done</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Priority
                                            </label>
                                            <select
                                                name="priority"
                                                value={editFormData.priority}
                                                onChange={handleEditChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Due Date
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="due_date"
                                            value={editFormData.due_date}
                                            onChange={handleEditChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Tags
                                        </label>
                                        <input
                                            type="text"
                                            name="tags"
                                            value={editFormData.tags}
                                            onChange={handleEditChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            placeholder="comma, separated, tags"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updating}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                                        >
                                            {updating ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Comments Section */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Comments</h2>

                            {/* Add Comment Form */}
                            <form onSubmit={handleCommentSubmit} className="mb-6">
                                <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a comment..."
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                                ></textarea>
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="submit"
                                        disabled={submittingComment || !commentText.trim()}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submittingComment ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </div>
                            </form>

                            {/* Comments List */}
                            <div className="space-y-4">
                                {task.comments && task.comments.length > 0 ? (
                                    task.comments.map((comment) => (
                                        <div key={comment.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-gray-900">
                                                        {comment.user?.first_name} {comment.user?.last_name}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(comment.created_at).toLocaleDateString()} at{' '}
                                                        {new Date(comment.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-gray-700">{comment.text}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                        </svg>
                                        <p>No comments yet. Be the first to comment!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Quick Status Update */}
                        {canUpdateStatus() && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Update Status</h3>
                                <div className="space-y-2">
                                    {['todo', 'in_progress', 'review', 'done'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusUpdate(status)}
                                            disabled={updating || task.status === status}
                                            className={`w-full px-4 py-2 rounded-lg font-medium transition ${
                                                task.status === status
                                                    ? 'bg-indigo-600 text-white cursor-default'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } disabled:opacity-50`}
                                        >
                                            {status.replace('_', ' ').toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Task Details */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Details</h3>
                            <div className="space-y-4">
                                {task.assigned_to_name && (
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Assigned To</div>
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                            <span className="font-medium text-gray-900">{task.assigned_to_name}</span>
                                        </div>
                                    </div>
                                )}

                                {task.created_by_name && (
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Created By</div>
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                            <span className="font-medium text-gray-900">{task.created_by_name}</span>
                                        </div>
                                    </div>
                                )}

                                {task.project_name && (
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Project</div>
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                                            </svg>
                                            <span className="font-medium text-gray-900">{task.project_name}</span>
                                        </div>
                                    </div>
                                )}

                                {task.due_date && (
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Due Date</div>
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            <span className={`font-medium ${task.is_overdue ? 'text-red-600' : 'text-gray-900'}`}>
                                                {new Date(task.due_date).toLocaleDateString()}
                                                {task.is_overdue && ' (Overdue)'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {task.estimated_hours && (
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Estimated Hours</div>
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span className="font-medium text-gray-900">{task.estimated_hours} hours</span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Created</div>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span className="font-medium text-gray-900">
                                            {new Date(task.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Last Updated</div>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                        </svg>
                                        <span className="font-medium text-gray-900">
                                            {new Date(task.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TaskDetail;