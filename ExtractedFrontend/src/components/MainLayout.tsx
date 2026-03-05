import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { Car, Mail, Phone, MapPin, Twitter, Instagram, Github } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-950 border-t border-white/5 pt-20 pb-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight italic uppercase">
                Colombo <span className="text-primary-500 underline decoration-2 underline-offset-4 not-italic">Rent A Car</span>
              </span>
            </div>
            <p className="text-surface-400 leading-relaxed text-sm">
              Providing premium mobility solutions across Colombo. Experience luxury and reliability with every ride.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary-600/20 hover:text-primary-400 transition-all">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary-600/20 hover:text-primary-400 transition-all">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary-600/20 hover:text-primary-400 transition-all">
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest italic">Quick Links</h3>
            <ul className="space-y-4 text-sm text-surface-400 font-bold uppercase tracking-tighter">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Our Fleet</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Services</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Safety</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest italic">Support</h3>
            <ul className="space-y-4 text-sm text-surface-400 font-bold uppercase tracking-tighter">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Terms of Use</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest italic">Contact Us</h3>
            <ul className="space-y-4 text-sm text-surface-400 font-bold tracking-tighter uppercase">
              <li className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-primary-500" />
                <span>Colombo 03, Sri Lanka</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary-500" />
                <span>+94 77 123 4567</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary-500" />
                <span>support@colomborentacar.lk</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 text-center text-surface-500 text-xs font-bold tracking-widest uppercase">
          <p>© {new Date().getFullYear()} Colombo Rent A Car. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
