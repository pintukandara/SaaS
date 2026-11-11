import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useUser } from './UserContext';
import { UsageContext } from './UsageContext';

export function UsageProvider({ children }) {
    const { user } = useUser();
    const userId = user?.id;
    const location = useLocation();
    const [snapshot, setSnapshot] = useState({ userId: null, usage: null, status: 'idle' });
    const pending = useRef(null);

    const refreshUsage = useCallback(({ force = false } = {}) => {
        if (!userId) return Promise.resolve();
        if (pending.current && !force) return pending.current.promise;
        pending.current?.controller.abort();
        const controller = new AbortController();
        const request = { controller };
        pending.current = request;
        request.promise = Promise.resolve().then(() => {
            if (controller.signal.aborted) return;
            setSnapshot(previous => ({
                userId,
                usage: previous.userId === userId ? previous.usage : null,
                status: 'loading',
            }));
            return api.get('/subscription/usage/current_month/', {
                signal: controller.signal, timeout: 10000,
            });
        })
            .then(response => {
                if (!controller.signal.aborted) setSnapshot({ userId, usage: response.data, status: 'ready' });
            })
            .catch(error => {
                if (controller.signal.aborted) return;
                const detail = error.response?.data?.detail || '';
                const inactive = error.response?.status === 403 && /active subscription/i.test(detail);
                setSnapshot({ userId, usage: null, status: inactive ? 'inactive' : 'error' });
            })
            .finally(() => {
                if (pending.current === request) pending.current = null;
            });
        return request.promise;
    }, [userId]);

    useEffect(() => {
        refreshUsage();
        return () => {
            pending.current?.controller.abort();
            pending.current = null;
        };
    }, [refreshUsage, location.key]);

    useEffect(() => {
        const refresh = () => {
            if (document.visibilityState === 'visible') refreshUsage();
        };
        window.addEventListener('focus', refresh);
        window.addEventListener('online', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('online', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [refreshUsage]);

    const usage = snapshot.userId === userId ? snapshot.usage : null;
    const status = snapshot.userId === userId ? snapshot.status : userId ? 'loading' : 'idle';

    useEffect(() => {
        if (!usage?.resets_at) return;
        // Long months exceed the browser's maximum timeout. Recheck daily until reset.
        let timer;
        const schedule = () => {
            const remaining = new Date(usage.resets_at).getTime() - Date.now();
            if (remaining <= 0) {
                refreshUsage();
                return;
            }
            timer = window.setTimeout(schedule, Math.min(remaining + 100, 86400000));
        };
        schedule();
        return () => window.clearTimeout(timer);
    }, [usage?.resets_at, refreshUsage]);

    return (
        <UsageContext.Provider value={{ usage, status, refreshUsage }}>
            {children}
        </UsageContext.Provider>
    );
}
