import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../context/UserContext';
import DashboardNav from '../../components/Dashboard/DashboardNav';

function ProjectsList() {
    const { user } = useUser();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'planning',
        owner: '',
        team: '',
        start_date: '',
        end_date: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchProjects(),
                fetchTeams(),
                fetchManagers(),
            ]);
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects/');
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams/');
            setTeams(response.data);
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        }
    };

    const fetchManagers = async () => {
        try {
            const response = await api.get('/auth/users/');
            const managerUsers = response.data.filter(u => 
                u.role === 'manager' || u.role === 'admin'
            );
            setManagers(managerUsers);
        } catch (error) {
            console.error('Failed to fetch managers:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const submitData = {
                ...formData,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                team: formData.team || null,
            };

            if (editingProject) {
                await api.put(`/projects/${editingProject.id}/`, submitData);
                setSuccess('Project updated successfully!');
            } else {
                await api.post('/projects/', submitData);
                setSuccess('Project created successfully!');
            }

            setFormData({ 
                name: '', 
                description: '', 
                status: 'planning', 
                owner: '', 
                team: '', 
                start_date: '', 
                end_date: '' 
            });
            setShowCreateModal(false);
            setEditingProject(null);
            fetchProjects();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to save project:', err);
            setError(err.response?.data?.detail || 'Failed to save project');
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            description: project.description || '',
            status: project.status,
            owner: project.owner || '',
            team: project.team || '',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
        });
        setShowCreateModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) {
            return;
        }

        try {
            await api.delete(`/projects/${id}/`);
            setSuccess('Project deleted successfully!');
            fetchProjects();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to delete project:', err);
            setError('Failed to delete project');
        }
    };

    const resetForm = () => {
        setFormData({ 
            name: '', 
            description: '', 
            status: 'planning', 
            owner: '', 
            team: '', 
            start_date: '', 
            end_date: '' 
        });
        setEditingProject(null);
        setShowCreateModal(false);
        setError('');
    };

    const getStatusColor = (status) => {
        const colors = {
            planning: 'bg-gray-100 text-gray-800',
            active: 'bg-green-100 text-green-800',
            on_hold: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <DashboardNav />
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-gray-600">Loading projects...</div>
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
                        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                        <p className="text-gray-600 mt-1">Manage organizational projects</p>
                    </div>
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition flex items-center shadow-md"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Create Project
                        </button>
                    )}
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                        <p className="text-green-700 font-medium">{success}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Projects Grid */}
                {projects.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <div className="inline-block bg-gray-100 p-6 rounded-full mb-4">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects yet</h3>
                        <p className="text-gray-500 mb-6">Create your first project to get started</p>
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Create Project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {project.name}
                                            </h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                                                {project.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {project.description || 'No description'}
                                        </p>
                                    </div>
                                    {user?.role === 'admin' && (
                                        <div className="flex items-center space-x-1 ml-2">
                                            <button
                                                onClick={() => handleEdit(project)}
                                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(project.id)}
                                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 text-sm">
                                    {project.owner_name && (
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                            <span className="font-medium">Owner:</span>
                                            <span className="ml-1">{project.owner_name}</span>
                                        </div>
                                    )}

                                    {project.team_name && (
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                            </svg>
                                            <span className="font-medium">Team:</span>
                                            <span className="ml-1">{project.team_name}</span>
                                        </div>
                                    )}

                                    {project.start_date && (
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            <span>{new Date(project.start_date).toLocaleDateString()}</span>
                                            {project.end_date && (
                                                <span> - {new Date(project.end_date).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create/Edit Project Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {editingProject ? 'Edit Project' : 'Create Project'}
                                </h2>
                                <button
                                    onClick={resetForm}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Project Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="e.g., Mobile App Development"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="4"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                        placeholder="Project description..."
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Status <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                                            required
                                        >
                                            <option value="planning">Planning</option>
                                            <option value="active">Active</option>
                                            <option value="on_hold">On Hold</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Project Owner <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="owner"
                                            value={formData.owner}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                                            required
                                        >
                                            <option value="">Select owner</option>
                                            {managers.map(mgr => (
                                                <option key={mgr.id} value={mgr.id}>
                                                    {mgr.full_name || `${mgr.first_name} ${mgr.last_name}`.trim() || mgr.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Assign to Team
                                    </label>
                                    <select
                                        name="team"
                                        value={formData.team}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                                    >
                                        <option value="">Select team (optional)</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>
                                                {team.name} ({team.department_name})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            value={formData.start_date}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            name="end_date"
                                            value={formData.end_date}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition"
                                    >
                                        {editingProject ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProjectsList;