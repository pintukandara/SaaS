import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

function Teams() {
    const [departments, setDepartments] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchData();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/auth/me/');
            setCurrentUser(response.data);
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [deptRes, teamRes] = await Promise.all([
                api.get('/departments/'),
                api.get('/teams/')
            ]);
            setDepartments(deptRes.data);
            setTeams(teamRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check if user is admin
    const isAdmin = currentUser?.role === 'admin';
    const isManager = currentUser?.role === 'manager';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Teams & Departments</h1>
                            <p className="text-gray-600 mt-1">
                                {isAdmin ? 'Manage your organization structure' : 'View your teams'}
                            </p>
                        </div>

                        {/* Only show create button for admins */}
                        {isAdmin && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <span>Create Team</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Role Badge */}
                <div className="mb-6">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        isAdmin ? 'bg-purple-100 text-purple-800' :
                        isManager ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        Your Role: {currentUser?.role?.toUpperCase()}
                    </span>
                </div>

                {/* Departments Grid - Only show if admin */}
                {isAdmin && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Departments</h2>
                            <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                                + Add Department
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {departments.map((dept) => (
                                <div key={dept.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                                    <h3 className="text-xl font-semibold mb-2">{dept.name}</h3>
                                    <p className="text-gray-600 text-sm mb-4">{dept.description}</p>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>{dept.team_count} teams</span>
                                        <span>{dept.employee_count} employees</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Teams List */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">
                        {isAdmin ? 'All Teams' : 'Your Teams'}
                    </h2>

                    {teams.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <div className="inline-block bg-gray-100 p-6 rounded-full mb-4">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No teams yet</h3>
                            <p className="text-gray-500">
                                {isAdmin ? 'Create your first team to get started' : 'You haven\'t been assigned to any teams yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.map((team) => (
                                <div key={team.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold">{team.name}</h3>
                                            <p className="text-sm text-gray-500">{team.department_name}</p>
                                        </div>
                                        <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                                            {team.member_count} members
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4">
                                        {team.description || 'No description'}
                                    </p>
                                    {team.manager_name && (
                                        <div className="flex items-center text-sm text-gray-500 mb-4">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                            Manager: {team.manager_name}
                                        </div>
                                    )}

                                    {/* Action buttons - only for admin or team manager */}
                                    {(isAdmin || team.manager === currentUser?.id) && (
                                        <div className="flex space-x-2 mt-4 pt-4 border-t">
                                            <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition text-sm">
                                                Edit
                                            </button>
                                            <button className="flex-1 bg-indigo-100 text-indigo-700 px-3 py-2 rounded hover:bg-indigo-200 transition text-sm">
                                                Members
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Box for Non-Admins */}
                {!isAdmin && (
                    <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                            </svg>
                            <p className="text-sm text-blue-700">
                                <strong>Note:</strong> Only administrators can create and manage teams.
                                Contact your admin if you need to join a team or create a new one.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Teams;