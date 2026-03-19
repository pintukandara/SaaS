import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../context/UserContext';
import { DashboardNav } from '../../components/Dashboard/DashboardNav';

function CreateTask() {
    const { user } = useUser();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        project: '',
        assigned_to: '',
        due_date: '',
        estimated_hours: '',
        tags: '',
    });

    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Check if user has permission to create tasks
        if (user?.role === 'employee') {
            navigate('/dashboard');
            return;
        }
        
        fetchInitialData();
    }, [user]);

    const fetchInitialData = async () => {
        setLoadingData(true);
        try {
            await Promise.all([
                fetchProjects(),
                fetchEmployees()
            ]);
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
            setError('Failed to load form data. Please refresh the page.');
        } finally {
            setLoadingData(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects/');
            setProjects(response.data);
            console.log('✅ Projects loaded:', response.data.length);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            if (user?.role === 'admin') {
                // ✅ Admin: Fetch all users
                const response = await api.get('/auth/users/');
                setEmployees(response.data);
                console.log('✅ All employees loaded:', response.data.length);
                
            } else if (user?.role === 'manager') {
                // ✅ Manager: Fetch team members from my teams
                const teamsRes = await api.get('/teams/my_teams/');
                console.log('Manager teams:', teamsRes.data);
                
                // Collect unique team members
                const teamMembersMap = new Map();
                
                for (const team of teamsRes.data) {
                    // Fetch detailed team info to get members
                    try {
                        const teamDetailRes = await api.get(`/teams/${team.id}/`);
                        const teamDetail = teamDetailRes.data;
                        
                        if (teamDetail.members && Array.isArray(teamDetail.members)) {
                            teamDetail.members.forEach(member => {
                                if (member.user) {
                                    teamMembersMap.set(member.user.id, member.user);
                                }
                            });
                        }
                    } catch (err) {
                        console.error(`Failed to fetch team ${team.id} details:`, err);
                    }
                }
                
                const uniqueMembers = Array.from(teamMembersMap.values());
                setEmployees(uniqueMembers);
                console.log('✅ Team members loaded:', uniqueMembers.length);
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            setError('Failed to load employees. You may still create unassigned tasks.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Prepare data for submission
            const submitData = {
                title: formData.title,
                description: formData.description,
                status: formData.status,
                priority: formData.priority,
                project: formData.project || null,
                assigned_to: formData.assigned_to || null,
                due_date: formData.due_date || null,
                estimated_hours: formData.estimated_hours || null,
                tags: formData.tags,
            };

            console.log('Submitting task:', submitData);

            const response = await api.post('/tasks/', submitData);
            
            console.log('✅ Task created:', response.data);
            setSuccess('Task created successfully!');
            
            // Redirect after 1.5 seconds
            setTimeout(() => {
                navigate('/tasks');
            }, 1500);
            
        } catch (err) {
            console.error('Failed to create task:', err);
            console.error('Error response:', err.response?.data);
            
            // Better error handling
            let errorMessage = 'Failed to create task. Please try again.';
            
            if (err.response?.data) {
                const errorData = err.response.data;
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else {
                    // Format field errors
                    const fieldErrors = Object.entries(errorData)
                        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                        .join('; ');
                    if (fieldErrors) {
                        errorMessage = fieldErrors;
                    }
                }
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <DashboardNav />
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center">
                        <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-600 font-medium">Loading form data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
                    <p className="text-gray-600 mt-2">Fill in the details to create a new task</p>
                </div>

                {/* Success Message */}
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

                {/* Error Message */}
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

                {/* Debug Info (Remove in production) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg text-sm">
                        <p className="text-blue-700 font-medium mb-2">Debug Info:</p>
                        <p className="text-blue-600">User Role: {user?.role}</p>
                        <p className="text-blue-600">Projects Available: {projects.length}</p>
                        <p className="text-blue-600">Employees Available: {employees.length}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 md:p-8">
                    {/* ... rest of the form stays the same ... */}
                    <div className="space-y-6">
                        {/* Task Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Task Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Design login page"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                placeholder="Provide detailed information about the task..."
                            ></textarea>
                        </div>

                        {/* Project and Assignee */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Project */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Project
                                </label>
                                <select
                                    name="project"
                                    value={formData.project}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                >
                                    <option value="">Select project (optional)</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                                {projects.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">No projects available</p>
                                )}
                            </div>

                            {/* Assign To */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Assign To
                                </label>
                                <select
                                    name="assigned_to"
                                    value={formData.assigned_to}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                >
                                    <option value="">Select employee (optional)</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.full_name || `${emp.first_name} ${emp.last_name}`.trim() || emp.username}
                                            {emp.role && ` (${emp.role})`}
                                        </option>
                                    ))}
                                </select>
                                {employees.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {user?.role === 'manager' 
                                            ? 'No team members found. Add members to your teams first.' 
                                            : 'No employees available'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Status and Priority */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    required
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review">In Review</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Priority <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    required
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        {/* Due Date and Estimated Hours */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Due Date
                                </label>
                                <input
                                    type="datetime-local"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            {/* Estimated Hours */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Estimated Hours
                                </label>
                                <input
                                    type="number"
                                    name="estimated_hours"
                                    value={formData.estimated_hours}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.5"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g., 8.5"
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tags
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., frontend, ui, design (comma-separated)"
                            />
                            <p className="text-sm text-gray-500 mt-1">Separate tags with commas</p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                </svg>
                                <div className="text-sm text-blue-700">
                                    <p className="font-medium mb-1">Task Creation Guidelines:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Choose appropriate priority based on urgency</li>
                                        <li>Assign to team members or leave unassigned for later</li>
                                        <li>Link to a project for better organization</li>
                                        <li>Set realistic due dates and estimated hours</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Task...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                        </svg>
                                        Create Task
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateTask;