import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Car, Calendar, TrendingUp,
    Clock, AlertCircle, CheckCircle2,
    ArrowUpRight, Activity, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatPrice, cn, formatDate } from '../utils';

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, delta?: string, color: string, href?: string }> = ({ title, value, icon, delta, color, href }) => {
    const cardContent = (
        <div className={cn("glass-card flex items-center justify-between !p-6 bg-surface-900/40 relative overflow-hidden group", href && "hover:border-primary-500/30 transition-colors cursor-pointer")}>
            <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full opacity-20 -translate-y-1/2 translate-x-1/2", color)} />
            <div className="space-y-2 relative z-10 text-left">
                <p className="text-xs font-bold text-surface-500 uppercase tracking-widest">{title}</p>
                <h3 className="text-3xl font-bold text-white">{value}</h3>
                {delta && <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {delta} from last month
                </p>}
            </div>
            <div className={cn("p-4 rounded-2xl relative z-10", color.replace('bg-', 'text-').replace('600', '500'), "bg-white/5")}>
                {icon}
            </div>
        </div>
    );

    if (href) {
        return <Link to={href}>{cardContent}</Link>;
    }

    return cardContent;
};

const AdminDashboard: React.FC = () => {
    // Mocking stats for now - in real app, fetch from an analytics endpoint
    const stats = [
        { title: 'Total Revenue', value: 'LKR 1.2M', icon: <TrendingUp className="h-6 w-6" />, delta: '12%', color: 'bg-emerald-600' },
        { title: 'Active Bookings', value: '24', icon: <Calendar className="h-6 w-6" />, color: 'bg-primary-600' },
        { title: 'Total Fleet', value: '48', icon: <Car className="h-6 w-6" />, color: 'bg-blue-600' },
        { title: 'New Requests', value: '8', icon: <AlertCircle className="h-6 w-6" />, color: 'bg-orange-600', href: '/admin/bookings' },
    ];

    const { data: recentRequests = [], isLoading } = useQuery({
        queryKey: ['admin-recent-requests'],
        queryFn: async () => {
            const response = await api.get('/admin/bookings', {
                params: {
                    status: 'PENDING',
                    page: 0,
                    size: 5,
                },
            });

            const payload = response.data;
            const rows = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.content)
                    ? payload.content
                    : [];

            return rows.slice(0, 5); // Just first 5
        }
    });

    return (
        <div className="min-h-screen pb-20 pt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-left">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold">Admin Command Center</h1>
                        <p className="text-surface-400">Holistic view of your rental operations and fleet health.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link to="/admin/logs" className="btn-outline flex items-center gap-2 !py-2 !px-4 text-xs font-bold">
                            <Activity className="h-4 w-4" /> Audit Logs
                        </Link>
                        <button className="btn-primary flex items-center gap-2 !py-2 !px-4 text-xs font-bold">
                            <ArrowUpRight className="h-4 w-4" /> Generate Report
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <StatCard key={i} {...stat} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Booking Requests */}
                    <div className="lg:col-span-2 space-y-6 text-left">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <Clock className="h-5 w-5 text-primary-500" />
                                Recent Booking Requests
                            </h2>
                        </div>

                        <div className="glass-card !p-0 overflow-hidden divide-y divide-white/5 bg-surface-900/40">
                            {isLoading ? (
                                <div className="p-8 text-center animate-pulse text-surface-500">Scanning incoming requests...</div>
                            ) : recentRequests.length > 0 ? (
                                recentRequests.map((req: { id: string, bookingTime: string, advanceAmount: number }) => (
                                    <div key={req.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-surface-800 rounded-xl flex items-center justify-center font-bold text-surface-400 group-hover:text-primary-400 transition-colors">
                                                {req.id.slice(-2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">Booking #{req.id.slice(-8).toUpperCase()}</div>
                                                <div className="text-[10px] text-surface-500 mt-1 uppercase tracking-widest font-medium">Requested {formatDate(req.bookingTime)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-xs font-bold text-white">{formatPrice(req.advanceAmount || 0)}</div>
                                                <div className="text-[10px] text-surface-500 uppercase">Est. Advance</div>
                                            </div>
                                            <Link
                                                to="/admin/bookings"
                                                className="p-2 bg-white/5 rounded-lg text-surface-400 hover:text-white hover:bg-primary-600/20 transition-all"
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center space-y-4">
                                    <div className="bg-white/5 p-4 rounded-full inline-block">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <p className="text-surface-500 text-sm">All requests processed. You're up to date!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions / Fleet Status */}
                    <div className="space-y-6 text-left">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <Activity className="h-5 w-5 text-primary-500" />
                            Fleet Status
                        </h2>

                        <div className="glass-card space-y-6 !bg-surface-900/40 divide-y divide-white/5 !p-6">
                            <div className="flex items-center justify-between pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-sm font-medium text-surface-300">Available</span>
                                </div>
                                <span className="text-lg font-bold">32</span>
                            </div>
                            <div className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    <span className="text-sm font-medium text-surface-300">Booked</span>
                                </div>
                                <span className="text-lg font-bold">12</span>
                            </div>
                            <div className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                                    <span className="text-sm font-medium text-surface-300">Maintenance</span>
                                </div>
                                <span className="text-lg font-bold">4</span>
                            </div>

                            <div className="pt-4">
                            </div>
                        </div>

                        {/* Verification Alert */}
                        <div className="glass-card !bg-orange-500/10 border-orange-500/20 !p-6 flex items-start space-x-4 leading-normal">
                            <AlertCircle className="h-6 w-6 text-orange-500 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-orange-400 mb-1">Verify Documents</h4>
                                <p className="text-[10px] text-orange-400/80 leading-relaxed text-left">
                                    There are <strong>3 new customers</strong> awaiting document verification.
                                    Approving them allows them to complete their reservations.
                                </p>
                                <Link to="/admin/bookings" className="mt-3 inline-block text-xs font-bold text-orange-400 hover:underline">Go to Approvals &rarr;</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
