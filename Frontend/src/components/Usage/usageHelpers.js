import { useUsage } from '../../context/UsageContext';

export function renewalDate(usage) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium', timeStyle: 'short', timeZone: usage.period_timezone,
    }).format(new Date(usage.resets_at));
}

export function useCreationBlocked(metric) {
    const { usage, status } = useUsage();
    return status === 'inactive' || (status === 'loading' && !usage)
        || (usage != null && (metric === 'tasks' ? usage.remaining_tasks : usage.remaining_projects) === 0);
}
