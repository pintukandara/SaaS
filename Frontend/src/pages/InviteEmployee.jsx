import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardNav from '../components/Dashboard/DashboardNav';

export const InviteEmployee = () => {
    const navigate = useNavigate();
    const [organisations, setOrganisations] = useState([]);
    const [organisationId, setOrganisationId] = useState('');
    const [formData, setFormData] = useState({ email: '', role: 'employee' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadOrganisations = async () => {
            try {
                const response = await api.get('/subscription/organisations/');
                const availableOrganisations = response.data.results ?? response.data;
                setOrganisations(availableOrganisations);
                if (availableOrganisations.length === 1) setOrganisationId(String(availableOrganisations[0].id));
            } catch {
                setError('Unable to load your organisation. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        loadOrganisations();
    }, []);

    const handleChange = ({ target: { name, value } }) => {
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        if (!organisationId) {
            setError('Select an organisation before sending an invitation.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post(`/subscription/organisations/${organisationId}/invite_member/`, formData);
            setSuccess(response.data.message || 'Invitation sent successfully.');
            setFormData({ email: '', role: 'employee' });
        } catch (err) {
            const apiError = err.response?.data;
            setError(apiError?.error || apiError?.detail || 'Unable to send the invitation. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav />
            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 mb-6">
                    <span aria-hidden="true" className="mr-2">←</span>Back to dashboard
                </Link>
                <section className="bg-white rounded-xl shadow-md p-6 sm:p-8">
                    <div className="flex items-start gap-4 mb-8">
                        <div className="shrink-0 rounded-lg bg-green-100 p-3">
                            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m15-9a4 4 0 010-8m3 17v-2a4 4 0 00-3-3.87M9 11a4 4 0 100-8 4 4 0 000 8z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Invite a team member</h1>
                            <p className="mt-1 text-gray-600">Send an email invitation and choose the member's role.</p>
                        </div>
                    </div>
                    {error && <div role="alert" className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-red-700">{error}</div>}
                    {success && <div role="status" className="mb-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-4 text-green-700">{success}</div>}
                    {loading ? <div className="py-10 text-center text-gray-600">Loading invitation form...</div> : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {organisations.length > 1 && <div>
                                <label htmlFor="organisation" className="block text-sm font-medium text-gray-700 mb-2">Organisation</label>
                                <select id="organisation" value={organisationId} onChange={(event) => setOrganisationId(event.target.value)} required className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">
                                    <option value="">Select an organisation</option>
                                    {organisations.map((organisation) => <option key={organisation.id} value={organisation.id}>{organisation.name}</option>)}
                                </select>
                            </div>}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Work email</label>
                                <input id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} placeholder="colleague@company.com" required className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">
                                    <option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option>
                                </select>
                                <p className="mt-2 text-sm text-gray-500">The invited user will receive this role when they accept.</p>
                            </div>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
                                <button type="button" onClick={() => navigate('/dashboard')} className="rounded-lg px-5 py-3 font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
                                <button type="submit" disabled={submitting || organisations.length === 0} className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">
                                    {submitting ? 'Sending invitation...' : 'Send invitation'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </main>
        </div>
    );
};
