import { Link } from 'react-router-dom';
import { useUsage } from '../../context/UsageContext';
import { renewalDate } from './usageHelpers';
import './usage.css';

export function UsageState() {
    const { status, refreshUsage } = useUsage();
    if (status === 'inactive') {
        return <p className="usage-note">Your organisation needs an active subscription. <Link to="/subscriptions">View plans</Link></p>;
    }
    if (status === 'error') {
        return <p className="usage-note" role="status">Usage unavailable. <button type="button" onClick={() => refreshUsage()}>Try again</button></p>;
    }
    return <p className="usage-note" role="status">Loading usage…</p>;
}

function UsageMetric({ label, used, limit, caption }) {
    const full = used >= limit;
    return (
        <div className="usage-metric">
            <dt>{label}</dt>
            <dd><span>{used.toLocaleString()}</span> / {limit.toLocaleString()}</dd>
            <progress aria-label={label} max={limit || 1} value={Math.min(used, limit || 1)} className={full ? 'usage-full' : ''} />
            <p className={full ? 'usage-caption usage-warning' : 'usage-caption'}>{caption}</p>
        </div>
    );
}

export default function UsageSummary({ detailed = false }) {
    const { usage, status, refreshUsage } = useUsage();
    return (
        <section className="usage-panel" aria-label="Organisation usage" aria-busy={status === 'loading'}>
            <div className="usage-heading">
                <div>
                    <h2>Organisation usage</h2>
                    <p>{usage ? usage.organisation_name : 'Shared across your organisation'}</p>
                </div>
                {usage && <button type="button" disabled={status === 'loading'} onClick={() => refreshUsage()}>{status === 'loading' ? 'Refreshing…' : 'Refresh usage'}</button>}
            </div>
            {usage ? <>
                <dl className="usage-metrics">
                    <UsageMetric label="Tasks this month" used={usage.tasks_created} limit={usage.limits.tasks_limit} caption={`${usage.remaining_tasks.toLocaleString()} ${usage.remaining_tasks === 1 ? 'task' : 'tasks'} remaining`} />
                    <UsageMetric label="Current projects" used={usage.current_projects} limit={usage.limits.projects_limit} caption={`${usage.remaining_projects.toLocaleString()} project ${usage.remaining_projects === 1 ? 'slot' : 'slots'} available`} />
                    <UsageMetric label="Current members" used={usage.current_users} limit={usage.limits.users_limit} caption={usage.current_users >= usage.limits.users_limit ? 'Member limit reached' : `${(usage.limits.users_limit - usage.current_users).toLocaleString()} member slots available`} />
                </dl>
                <div className="usage-footer">
                    <p>Task allowance renews <time dateTime={usage.resets_at}>{renewalDate(usage)}</time> ({usage.period_timezone}).</p>
                    {!detailed && <Link to="/subscriptions">Usage &amp; plans</Link>}
                </div>
                {detailed && <div className="usage-details">
                    <p>Tasks count when created. Editing or deleting a task does not restore this month’s allowance.</p>
                    <p>Projects use current capacity. Deleting a project frees a slot. {usage.projects_created.toLocaleString()} {usage.projects_created === 1 ? 'project' : 'projects'} created this month.</p>
                </div>}
            </> : <UsageState />}
        </section>
    );
}
