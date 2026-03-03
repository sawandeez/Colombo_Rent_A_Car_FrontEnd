import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Car, Zap } from 'lucide-react';
import api from '../services/api';
import type { VehicleType } from '../types';

const HomePage: React.FC = () => {
  const { data: types = [], isLoading } = useQuery<VehicleType[]>({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const response = await api.get('/vehicle-types');
      return response.data;
    },
  });

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Your Journey Starts Here
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Premium car rental service with the best vehicles and most competitive prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <a
                href="/vehicles"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Fleet
              </a>
              <button className="px-8 py-4 bg-slate-900 text-white border border-white/10 rounded-lg font-semibold hover:border-white/20 transition-colors">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Vehicle Types Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">Our Vehicle Categories</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-slate-900 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {types.map(type => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{type.name}</h3>
                  <Car className="h-6 w-6 text-blue-500" />
                </div>
                <p className="text-slate-400 text-sm">Premium {type.name} vehicles available for rent</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Zap />, title: 'Quick Booking', desc: 'Reserve your vehicle in seconds' },
              { icon: <Car />, title: 'Premium Fleet', desc: 'Well-maintained, modern vehicles' },
              { icon: <Zap />, title: '24/7 Support', desc: 'Round-the-clock customer service' },
            ].map((feature, idx) => (
              <div key={idx} className="space-y-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
