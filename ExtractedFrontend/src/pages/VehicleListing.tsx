import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Car, AlertCircle, Users, Fuel, Gauge, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import type { VehicleType, VehicleSummary } from '../types';
import { cn } from '../utils';

const VehicleTypeButton: React.FC<{ type: VehicleType; isSelected: boolean; onClick: () => void }> = ({ type, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-6 py-3 rounded-2xl transition-all whitespace-nowrap text-sm font-bold uppercase tracking-wider',
        isSelected
          ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
          : 'bg-surface-900 border border-white/5 text-surface-400 hover:text-white hover:border-white/10'
      )}
    >
      {type.name}
    </button>
  );
};

const VehicleCard: React.FC<{ vehicle: VehicleSummary }> = ({ vehicle }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden group flex flex-col h-full"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-800">
        <img
          src={vehicle.thumbnailUrl || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800'}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-primary-600/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            {vehicle.type || 'Standard'}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors uppercase tracking-tight italic">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-xs text-surface-500 font-medium">{vehicle.year} Model</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-primary-400">LKR {vehicle.rentalPricePerDay?.toLocaleString() || '8,500'}</div>
            <div className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Per Day</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
          <div className="flex items-center space-x-2 text-surface-400">
            <Users className="h-4 w-4 text-primary-500" />
            <span className="text-xs font-medium">4 Passengers</span>
          </div>
          <div className="flex items-center space-x-2 text-surface-400">
            <Gauge className="h-4 w-4 text-primary-500" />
            <span className="text-xs font-medium">Automatic</span>
          </div>
          <div className="flex items-center space-x-2 text-surface-400">
            <Fuel className="h-4 w-4 text-primary-500" />
            <span className="text-xs font-medium">Hybrid</span>
          </div>
          <div className="flex items-center space-x-2 text-surface-400">
            <Car className="h-4 w-4 text-primary-500" />
            <span className="text-xs font-medium">Air Con</span>
          </div>
        </div>

        <div className="pt-2 mt-auto">
          <button className="w-full btn-primary group/btn">
            View Details
            <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const VehicleListing: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTypeId = searchParams.get('typeId');
  const [searchQuery, setSearchQuery] = React.useState('');

  const setSelectedTypeId = (id: string) => {
    setSearchParams({ typeId: id });
  };

  const { data: types = [], isLoading: typesLoading } = useQuery<VehicleType[]>({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const response = await api.get('/vehicle-types');
      return response.data;
    },
  });

  const { data: vehicles = [], isLoading: vehiclesLoading, error } = useQuery<VehicleSummary[]>({
    queryKey: ['vehicles', selectedTypeId],
    queryFn: async () => {
      if (!selectedTypeId) return [];
      const response = await api.get(`/vehicles?typeId=${selectedTypeId}`);
      return response.data;
    },
    enabled: !!selectedTypeId,
  });

  React.useEffect(() => {
    if (types.length > 0 && !selectedTypeId) {
      setSearchParams({ typeId: types[0].id }, { replace: true });
    }
  }, [types, selectedTypeId, setSearchParams]);

  const filteredVehicles = vehicles.filter(v =>
    `${v.make} ${v.model}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary-500 font-bold uppercase tracking-widest text-xs">
              <Car className="h-4 w-4" />
              Premium Fleet
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tight">Explore Our <span className="text-primary-500">Fleet</span></h1>
            <p className="text-surface-400 max-w-lg">Choose from our premium selection of vehicles, meticulously maintained for your comfort.</p>
          </div>
          <div className="flex items-center space-x-2 bg-primary-600/10 text-primary-400 px-6 py-3 rounded-2xl border border-primary-500/20 text-sm font-bold uppercase tracking-tighter">
            <span className="text-xl leading-none">{filteredVehicles.length}</span>
            <span>Vehicles Ready</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-3/4 space-y-8">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-surface-500 uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Select Category
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {typesLoading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-12 w-32 glass-card animate-pulse" />)
                ) : (
                  types.map(type => (
                    <VehicleTypeButton
                      key={type.id}
                      type={type}
                      isSelected={selectedTypeId === type.id}
                      onClick={() => {
                        setSelectedTypeId(type.id);
                        setSearchQuery('');
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by vehicle make or model..."
                className="input-field pl-14 py-5"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Vehicles Grid */}
        <AnimatePresence mode="popLayout">
          {vehiclesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[450px] glass-card animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-red-500/20 bg-red-500/5">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 uppercase italic tracking-tight">System Error</h3>
              <p className="text-red-400/80">Failed to load vehicles. Please refresh the page.</p>
            </div>
          ) : filteredVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 leading-normal">
              {filteredVehicles.map((vehicle, idx) => (
                <VehicleCard key={idx} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 glass-card">
              <Search className="h-16 w-16 text-surface-700 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2 uppercase italic tracking-tight">No Vehicles Match</h3>
              <p className="text-surface-500 font-medium">Try adjusting your category or search terms.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VehicleListing;
