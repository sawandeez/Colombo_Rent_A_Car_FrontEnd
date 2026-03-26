import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Activity, Shield, Clock
} from 'lucide-react';
import api from '../services/api';
import { cn, formatDate } from '../utils';

const AuditLogs: React.FC = () => {
    const [filter, setFilter] = React.useState('ALL');

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['admin-logs', filter],
        queryFn: async () => {
            const response = await api.get('/admin/audit-logs');
            return response.data;
        }
    });

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'text-emerald-400';
        if (action.includes('UPDATE')) return 'text-blue-400';
        if (action.includes('DELETE')) return 'text-red-400';
        if (action.includes('LOGIN')) return 'text-primary-400';
        return 'text-surface-400';
    };

    return (
        <div className="min-h-screen pb-20 pt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-left">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold">System Audit Logs</h1>
                        <p className="text-surface-400">Security monitoring and administrative action tracking.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="glass-card !p-1 !bg-surface-900/40 flex gap-1">
                            {['ALL', 'USER', 'BOOKING', 'VEHICLE'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all",
                                        filter === f ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" : "text-surface-500 hover:text-white"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="glass-card !p-0 overflow-hidden bg-surface-900/40 divide-y divide-white/5 leading-normal">
                    <div className="p-6 bg-white/5 grid grid-cols-12 gap-4 text-[10px] font-bold uppercase tracking-widest text-surface-500">
                        <div className="col-span-3">Timestamp</div>
                        <div className="col-span-2">Admin / User</div>
                        <div className="col-span-2 text-center">Action</div>
                        <div className="col-span-1 text-center">Module</div>
                        <div className="col-span-4 pl-4 text-left">Details</div>
                    </div>

                    {isLoading ? (
                        [1, 2, 3, 4, 5].map(i => <div key={i} className="p-8 animate-pulse bg-white/5 mx-6 my-4 rounded-2xl" />)
                    ) : logs.length > 0 ? (
                        logs.map((log: any) => (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key={log.id}
                                className="p-6 grid grid-cols-12 gap-4 items-center group hover:bg-white/5 transition-colors"
                            >
                                <div className="col-span-3 flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-surface-600" />
                                    <span className="text-xs font-medium text-surface-400">{formatDate(log.timestamp)}</span>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary-600/20 flex items-center justify-center text-[10px] font-bold text-primary-400">
                                        {log.actorEmail?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-bold text-white truncate max-w-[120px]">{log.actorEmail}</span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className={cn("text-[10px] font-black uppercase tracking-tighter", getActionColor(log.action))}>
                                        {log.action}
                                    </span>
                                </div>
                                <div className="col-span-1 text-center">
                                    <span className="px-2 py-0.5 bg-surface-800 text-surface-500 rounded text-[9px] font-bold">
                                        {log.resourceType}
                                    </span>
                                </div>
                                <div className="col-span-4 pl-4 text-xs text-surface-400 font-medium group-hover:text-surface-200 transition-colors text-left truncate">
                                    {log.details || 'System operation performed successfully.'}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-32 text-center space-y-4">
                            <Shield className="h-12 w-12 text-surface-800 mx-auto" />
                            <p className="text-surface-500 font-medium">No system events recorded for this selection.</p>
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <div className="flex justify-between items-center text-[10px] text-surface-600 font-bold uppercase tracking-widest px-4">
                    <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3" /> System Heartbeat Stable
                    </div>
                    <div>Retention: 90 Days</div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
