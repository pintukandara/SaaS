import { Link } from 'react-router-dom';
import { useUsage } from '../../context/UsageContext';
import { UsageState } from './UsageSummary';
import { renewalDate } from './usageHelpers';
import './usage.css';

export default function CreationAllowance({ metric }) {
    const { usage } = useUsage();
    if (!usage) return <div className="usage-allowance"><UsageState /></div>;
    const tasks = metric === 'tasks';
    const remaining = tasks ? usage.remaining_tasks : usage.remaining_projects;
    return (
        <div className="usage-allowance" role="status">
            <p className={remaining === 0 ? 'usage-warning' : ''}>
                {tasks ? `${remaining.toLocaleString()} ${remaining === 1 ? 'task' : 'tasks'} remaining this month.` : `${remaining.toLocaleString()} project ${remaining === 1 ? 'slot' : 'slots'} available.`}
                {remaining === 0 && ' Limit reached.'}
            </p>
            <p className="usage-caption">{tasks
                ? `Allowance renews ${renewalDate(usage)} (${usage.period_timezone}). Deleting tasks does not restore allowance.`
                : 'Deleting a project frees a slot. Editing existing projects does not use a new slot.'}</p>
            {remaining === 0 && <Link to="/subscriptions">View subscription plans</Link>}
        </div>
    );
}
