import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck2, Car, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils';

type AdminNavItem = {
    name: string;
    to: string;
    icon: React.ReactNode;
    specialAdminOnly?: boolean;
    adminOnly?: boolean;
};

const AdminLayout: React.FC = () => {
    const role = useAuthStore((state) => state.role);

    const navItems: AdminNavItem[] = [
        { name: 'Dashboard', to: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
        { name: 'Bookings', to: '/admin/bookings', icon: <CalendarCheck2 className="h-4 w-4" /> },
        { name: 'Vehicles', to: '/admin/vehicles', icon: <Car className="h-4 w-4" />, adminOnly: true },
        { name: 'Audit Logs', to: '/admin/logs', icon: <ClipboardList className="h-4 w-4" />, specialAdminOnly: true },
    ];

    const visibleNavItems = navItems.filter((item) => {
        if (item.specialAdminOnly && role !== 'SPECIAL_ADMIN') return false;
        if (item.adminOnly && role !== 'ADMIN') return false;
        return true;
    });

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">
                    <aside className="glass-card !p-4 bg-surface-900/40 lg:sticky lg:top-24">
                        <h2 className="text-xs font-bold text-surface-500 uppercase tracking-widest px-3 mb-3">
                            Admin Panel
                        </h2>
                        <nav className="space-y-2">
                            {visibleNavItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/admin'}
                                    className={({ isActive }) => cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                                        isActive
                                            ? 'bg-primary-600 text-white'
                                            : 'text-surface-300 hover:bg-white/5 hover:text-white',
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </aside>

                    <div>
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
