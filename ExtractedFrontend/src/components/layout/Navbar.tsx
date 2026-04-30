import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, User, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// HIDDEN_CONCEPT:2OP-cmp
const Navbar: React.FC = () => {
    const { isAuthenticated, user, logout, role } = useAuthStore();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { name: 'Vehicles', path: '/vehicles' },
        { name: 'Services', path: '/#services' },
        { name: 'About', path: '/#about' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-950/80 backdrop-blur-lg border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="bg-primary-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                            <Car className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Colombo <span className="text-primary-500 underline decoration-2 underline-offset-4">Rent A Car</span></span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="text-surface-400 hover:text-white transition-colors text-sm font-medium"
                            >
                                {link.name}
                            </Link>
                        ))}

                        <div className="flex items-center space-x-4 pl-4 border-l border-white/10">
                            {isAuthenticated ? (
                                <div className="flex items-center space-x-4">
                                    {(role === 'ADMIN' || role === 'SPECIAL_ADMIN') && (
                                        <Link
                                            to="/admin"
                                            className="p-2 text-surface-400 hover:text-primary-400 transition-colors"
                                            title="Admin Dashboard"
                                        >
                                            <LayoutDashboard className="h-5 w-5" />
                                        </Link>
                                    )}
                                    <Link
                                        to="/profile"
                                        className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full hover:bg-white/10 transition-all text-sm font-medium"
                                    >
                                        <User className="h-4 w-4" />
                                        <span>{user?.name.split(' ')[0]}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-surface-400 hover:text-red-400 transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link to="/login" className="text-sm font-medium text-surface-400 hover:text-white transition-colors">
                                        Login
                                    </Link>
                                    <Link to="/register" className="btn-primary py-1.5 px-6 !rounded-full text-sm">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-surface-400 hover:text-white"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="md:hidden bg-surface-900 border-b border-white/10 py-4 px-4 space-y-4 animate-in slide-in-from-top duration-300">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className="block text-surface-400 hover:text-white transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <hr className="border-white/5" />
                    {isAuthenticated ? (
                        <div className="space-y-4">
                            <Link
                                to="/profile"
                                className="flex items-center space-x-2 text-surface-400 hover:text-white"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <User className="h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 text-red-500"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-2">
                            <Link to="/login" className="text-center py-2 text-surface-400 hover:text-white" onClick={() => setIsMenuOpen(false)}>
                                Login
                            </Link>
                            <Link to="/register" className="btn-primary text-center" onClick={() => setIsMenuOpen(false)}>
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
