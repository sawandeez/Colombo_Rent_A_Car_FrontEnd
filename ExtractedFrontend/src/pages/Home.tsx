import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Car, ChevronRight, Star, Shield, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { VehicleType } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const { data: vehicleTypes = [], isLoading } = useQuery<VehicleType[]>({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const response = await api.get('/vehicle-types');
      return response.data;
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-primary-600/10 border border-primary-500/20 px-4 py-2 rounded-full text-primary-400 text-sm font-bold tracking-wide uppercase"
            >
              <Star className="h-4 w-4 fill-current" />
              Premium Rental Service in Colombo
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold text-white tracking-tight leading-[1.1]"
            >
              Drive the <span className="text-primary-500 underline decoration-4 underline-offset-8">Future</span> of Mobility
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-surface-400 max-w-2xl mx-auto leading-relaxed"
            >
              Experience unmatched luxury and reliability with Colombo's most exclusive fleet.
              From city sedans to rugged SUVs, your perfect journey starts here.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4 pt-4"
            >
              <button onClick={() => navigate('/vehicles')} className="btn-primary">
                Browse Fleet
                <ChevronRight className="h-5 w-5" />
              </button>
              <button className="btn-outline">Learn More</button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats/Features */}
      <section className="py-20 bg-surface-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Fully Insured", desc: "Your safety is our priority with comprehensive coverage." },
              { icon: Clock, title: "24/7 Support", desc: "Our team is always available to assist with your journey." },
              { icon: Zap, title: "Fast Booking", desc: "Secure your vehicle in less than 2 minutes." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 flex flex-col items-center text-center space-y-4"
              >
                <div className="bg-primary-600/10 p-4 rounded-2xl">
                  <feature.icon className="h-8 w-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">{feature.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-white tracking-tight">Our <span className="text-primary-500">Fleet</span> Categories</h2>
              <p className="text-surface-400 max-w-xl">
                Explore our diverse range of premium vehicles, meticulously maintained for your comfort and style.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-64 glass-card animate-pulse" />
              ))
            ) : (
              vehicleTypes.map((type, i) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/vehicles?typeId=${type.id}`)}
                  className="glass-card group cursor-pointer p-10 overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Car className="w-32 h-32 text-primary-500" />
                  </div>

                  <div className="relative z-10 space-y-4">
                    <h3 className="text-3xl font-bold text-white group-hover:text-primary-400 transition-colors uppercase tracking-tight italic">
                      {type.name}
                    </h3>
                    <p className="text-surface-400 text-sm font-medium">View Available {type.name}s</p>
                    <div className="pt-4">
                      <div className="w-12 h-1 bg-primary-600 group-hover:w-24 transition-all duration-500" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
