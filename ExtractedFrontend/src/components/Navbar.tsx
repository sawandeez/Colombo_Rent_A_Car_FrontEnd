import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Car, User } from 'lucide-react';
import { cn } from '../utils';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/vehicles', label: 'Our Fleet' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-primary-600 p-2.5 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-primary-600/20">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight uppercase italic">
              Colombo <span className="text-primary-500 underline decoration-2 underline-offset-4 not-italic">Rent A Car</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            <div className="flex gap-8">
              {links.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-sm font-bold uppercase tracking-widest transition-all hover:text-primary-400 relative py-2",
                    isActive(link.href) ? "text-primary-500" : "text-surface-400"
                  )}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 pl-8 border-l border-white/10">
              <button className="p-2 text-surface-400 hover:text-white transition-colors">
                <User className="h-5 w-5" />
              </button>
              <button className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                Login
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-surface-400 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-6 space-y-2 animate-in slide-in-from-top duration-300">
            {links.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all",
                  isActive(link.href) ? "bg-primary-600/10 text-primary-500 border border-primary-500/20" : "text-surface-400 hover:text-white"
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-2">
              <button className="w-full btn-primary py-3">Login</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
