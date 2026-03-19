import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useUser } from '../context/UserContext';
import DashboardNav from '../components/Dashboard/DashboardNav'

function Teams() {
    const { user } = useUser();
    const navigate = useNavigate();

    const [teams, setTeams] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [managers, setManagers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [editingTeam, setEditingTeam] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        department: '',
        manager: '',
    });

    const [memberFormData, setMemberFormData] = useState({
        user_id: '',
        role: 'member',
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
                fetchTeams(),
                fetchDepartments(),
                fetchManagers(),
                fetchEmployees(),
            ]);
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        } finally {
            setLoading(false);
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

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments/');
            setDepartments(response.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const fetchManagers = async () => {
        try {
            const response = await api.get('/auth/users/');
            // Filter only managers and admins
            const managerUsers = response.data.filter(u => 
                u.role === 'manager' || u.role === 'admin'
            );
            setManagers(managerUsers);
        } catch (error) {
            console.error('Failed to fetch managers:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/auth/users/');
            setEmployees(response.data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleMemberInputChange = (e) => {
        setMemberFormData({
            ...memberFormData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingTeam) {
                await api.put(`/teams/${editingTeam.id}/`, formData);
                setSuccess('Team updated successfully!');
            } else {
                await api.post('/teams/', formData);
                setSuccess('Team created successfully!');
            }

            setFormData({ name: '', description: '', department: '', manager: '' });
            setShowCreateModal(false);
            setEditingTeam(null);
            fetchTeams();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to save team:', err);
            setError(err.response?.data?.detail || 'Failed to save team');
        }
    };

    const handleEdit = (team) => {
        setEditingTeam(team);
        setFormData({
            name: team.name,
            description: team.description || '',
            department: team.department || '',
            manager: team.manager || '',
        });
        setShowCreateModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this team?')) {
            return;
        }

        try {
            await api.delete(`/teams/${id}/`);
            setSuccess('Team deleted successfully!');
            fetchTeams();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to delete team:', err);
            setError('Failed to delete team');
        }
    };

    const handleViewMembers = async (team) => {
        try {
            const response = await api.get(`/teams/${team.id}/`);
            setSelectedTeam(response.data);
            setShowMembersModal(true);
        } catch (error) {
            console.error('Failed to fetch team details:', error);
            setError('Failed to load team members');
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await api.post(`/teams/${selectedTeam.id}/add_member/`, memberFormData);
            setSuccess('Member added successfully!');
            setMemberFormData({ user_id: '', role: 'member' });
            
            // Refresh team details
            const response = await api.get(`/teams/${selectedTeam.id}/`);
            setSelectedTeam(response.data);
            fetchTeams();
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to add member:', err);
            setError(err.response?.data?.detail || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) {
            return;
        }

        try {
            await api.delete(`/teams/${selectedTeam.id}/remove_member/`, {
                data: { user_id: userId }
            });
            setSuccess('Member removed successfully!');
            
            // Refresh team details
            const response = await api.get(`/teams/${selectedTeam.id}/`);
            setSelectedTeam(response.data);
            fetchTeams();
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to remove member:', err);
            setError('Failed to remove member');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', department: '', manager: '' });
        setEditingTeam(null);
        setShowCreateModal(false);
        setError('');
    };

    const canManageTeams = () => {
        return user?.role === 'admin' || user?.role === 'manager';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <DashboardNav />
                <div className="flex items-center justify-center h-96">
                    <div className="text-xl text-gray-600">Loading teams...</div>
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
                        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
                        <p className="text-gray-600 mt-1">Manage teams and members</p>
                    </div>
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center shadow-md"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Create Team
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

                {/* Teams Grid */}
                {teams.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <div className="inline-block bg-gray-100 p-6 rounded-full mb-4">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No teams yet</h3>
                        <p className="text-gray-500 mb-6">Create your first team to get started</p>
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Create Team
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team) => (
                            <div
                                key={team.id}
                                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            {team.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-2">
                                            {team.department_name || 'No department'}
                                        </p>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {team.description || 'No description'}
                                        </p>
                                    </div>
                                    {user?.role === 'admin' && (
                                        <div className="flex items-center space-x-1 ml-2">
                                            <button
                                                onClick={() => handleEdit(team)}
                                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(team.id)}
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

                                {team.manager_name && (
                                    <div className="flex items-center text-sm text-gray-600 mb-3">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                        <span className="font-medium">Manager:</span>
                                        <span className="ml-1">{team.manager_name}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-indigo-600">
                                            {team.member_count || 0}
                                        </div>
                                        <div className="text-sm text-gray-500">Members</div>
                                    </div>
                                    
                                    {canManageTeams() && (
                                        <button
                                            onClick={() => handleViewMembers(team)}
                                            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition text-sm font-medium"
                                        >
                                            Manage Members
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create/Edit Team Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {editingTeam ? 'Edit Team' : 'Create Team'}
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
                                        Team Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., Frontend Team"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="">Select department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Manager
                                    </label>
                                    <select
                                        name="manager"
                                        value={formData.manager}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option value="">Select manager (optional)</option>
                                        {managers.map(mgr => (
                                            <option key={mgr.id} value={mgr.id}>
                                                {mgr.full_name || `${mgr.first_name} ${mgr.last_name}`.trim() || mgr.username}
                                            </option>
                                        ))}
                                    </select>
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        placeholder="Team description..."
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
                                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition"
                                    >
                                        {editingTeam ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Members Management Modal */}
                {showMembersModal && selectedTeam && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {selectedTeam.name} - Members
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowMembersModal(false);
                                        setSelectedTeam(null);
                                        setMemberFormData({ user_id: '', role: 'member' });
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>

                            {/* Add Member Form */}
                            <form onSubmit={handleAddMember} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Add Team Member</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-2">
                                        <select
                                            name="user_id"
                                            value={memberFormData.user_id}
                                            onChange={handleMemberInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                            required
                                        >
                                            <option value="">Select employee</option>
                                            {employees
                                                .filter(emp => !selectedTeam.members?.some(m => m.user?.id === emp.id))
                                                .map(emp => (
                                                    <option key={emp.id} value={emp.id}>
                                                        {emp.full_name || `${emp.first_name} ${emp.last_name}`.trim() || emp.username}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                                    >
                                        Add Member
                                    </button>
                                </div>
                            </form>

                            {/* Members List */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">
                                    Team Members ({selectedTeam.members?.length || 0})
                                </h3>
                                {selectedTeam.members && selectedTeam.members.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedTeam.members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {member.user?.first_name?.[0] || member.user?.username?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {member.user?.full_name || 
                                                             `${member.user?.first_name} ${member.user?.last_name}`.trim() || 
                                                             member.user?.username}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {member.user?.email}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMember(member.user?.id)}
                                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Remove member"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No members in this team yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Teams;