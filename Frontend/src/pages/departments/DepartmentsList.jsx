import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useUser } from '../../context/UserContext';
import DashboardNav from '../../components/Dashboard/DashboardNav';

function DepartmentsList() {
    const { user } = useUser();
    const navigate = useNavigate();

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/departments/');
            setDepartments(response.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
            setError('Failed to load departments');
        } finally {
            setLoading(false);
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
            if (editingDepartment) {
                // Update existing department
                await api.put(`/departments/${editingDepartment.id}/`, formData);
                setSuccess('Department updated successfully!');
            } else {
                // Create new department
                await api.post('/departments/', formData);
                setSuccess('Department created successfully!');
            }

            setFormData({ name: '', description: '' });
            setShowCreateModal(false);
            setEditingDepartment(null);
            fetchDepartments();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to save department:', err);
            setError(err.response?.data?.detail || 'Failed to save department');
        }
    };

    const handleEdit = (department) => {
        setEditingDepartment(department);
        setFormData({
            name: department.name,
            description: department.description || '',
        });
        setShowCreateModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/departments/${id}/`);
            setSuccess('Department deleted successfully!');
            fetchDepartments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to delete department:', err);
            setError('Failed to delete department. It may have associated teams.');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '' });
        setEditingDepartment(null);
        setShowCreateModal(false);
        setError('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <DashboardNav />
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-gray-600">Loading departments...</div>
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
                        <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
                        <p className="text-gray-600 mt-1">Manage organizational departments</p>
                    </div>
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition flex items-center shadow-md"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Create Department
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

                {/* Departments Grid */}
                {departments.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <div className="inline-block bg-gray-100 p-6 rounded-full mb-4">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No departments yet</h3>
                        <p className="text-gray-500 mb-6">Create your first department to get started</p>
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Create Department
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departments.map((department) => (
                            <div
                                key={department.id}
                                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {department.name}
                                        </h3>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {department.description || 'No description'}
                                        </p>
                                    </div>
                                    {user?.role === 'admin' && (
                                        <div className="flex items-center space-x-1 ml-2">
                                            <button
                                                onClick={() => handleEdit(department)}
                                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(department.id)}
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

                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {department.team_count || 0}
                                        </div>
                                        <div className="text-sm text-gray-500">Teams</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {department.employee_count || 0}
                                        </div>
                                        <div className="text-sm text-gray-500">Employees</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {editingDepartment ? 'Edit Department' : 'Create Department'}
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
                                        Department Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="e.g., Engineering, Marketing"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        placeholder="Department description..."
                                    ></textarea>
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
                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                                    >
                                        {editingDepartment ? 'Update' : 'Create'}
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

export default DepartmentsList;