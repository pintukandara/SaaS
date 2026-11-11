import { createContext, useContext } from 'react';

export const UsageContext = createContext(null);

export function useUsage() {
    const context = useContext(UsageContext);
    if (!context) throw new Error('useUsage must be used within UsageProvider');
    return context;
}
