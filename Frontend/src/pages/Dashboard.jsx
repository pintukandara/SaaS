import { useUser } from '../context/UserContext';
import EmployeeDashboard from './Dashboards/EmployeeDashboard';
import ManagerDashboard from './Dashboards/ManagerDashboard';
import AdminDashboard from './Dashboards/AdminDashboard';

export function Dashboard() {
    const { user, loading } = useUser(); 

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Route to appropriate dashboard based on role
    switch (user?.role) {
        case 'admin':
            return <AdminDashboard />;  
        case 'manager':
            return <ManagerDashboard />;
        case 'employee':
            return <EmployeeDashboard />;
        default:
            return <EmployeeDashboard />;
    }
}

export default Dashboard;