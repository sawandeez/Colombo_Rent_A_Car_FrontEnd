import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Car, AlertCircle } from 'lucide-react';
import api from '../services/api';
import type { VehicleType, VehicleSummary } from '../types';
import { cn } from '../utils';

const VehicleTypeButton: React.FC<{ type: VehicleType; isSelected: boolean; onClick: () => void }> = ({ type, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-6 py-3 rounded-xl transition-all whitespace-nowrap text-sm font-medium',
        isSelected
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:border-white/10'
      )}
    >
      {type.name}
    </button>
  );
};

const VehicleCard: React.FC<{ vehicle: VehicleSummary }> = ({ vehicle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-white/10 bg-slate-950 hover:border-white/20 transition-all"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
        <img
          src={vehicle.thumbnailUrl || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800'}
          alt={vehicle.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-white">{vehicle.name}</h3>
        <p className="text-sm text-slate-400 mt-1">Click to view details</p>
      </div>
    </motion.div>
  );
};

const VehicleListing: React.FC = () => {
  const [selectedTypeId, setSelectedTypeId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch vehicle types
  const { data: types = [], isLoading: typesLoading } = useQuery<VehicleType[]>({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const response = await api.get('/vehicle-types');
      return response.data;
    },
  });

  // Fetch vehicles for selected type
  const { data: vehicles = [], isLoading: vehiclesLoading, error } = useQuery<VehicleSummary[]>({
    queryKey: ['vehicles', selectedTypeId],
    queryFn: async () => {
      if (!selectedTypeId) return [];
      const response = await api.get(`/vehicles?typeId=${selectedTypeId}`);
      return response.data;
    },
    enabled: !!selectedTypeId,
  });

  const filteredVehicles = vehicles.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 pt-10 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Explore Our Fleet</h1>
            <p className="text-slate-400">Choose from our premium selection of vehicles.</p>
          </div>
          <div className="flex items-center space-x-2 bg-blue-600/10 text-blue-400 px-4 py-2 rounded-xl border border-blue-500/20 text-sm font-medium">
            <Car className="h-4 w-4" />
            <span>{filteredVehicles.length} Vehicles Available</span>
          </div>
        </div>

        {/* Vehicle Type Filter */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Select Vehicle Type</h2>
          {typesLoading ? (
            <div className="flex gap-2 pb-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 w-24 bg-slate-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {types.map(type => (
                <VehicleTypeButton
                  key={type.id}
                  type={type}
                  isSelected={selectedTypeId === type.id}
                  onClick={() => {
                    setSelectedTypeId(type.id);
                    setSearchQuery('');
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Search (shown when type selected) */}
        {selectedTypeId && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by vehicle name..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900 border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* Vehicles Grid */}
        {selectedTypeId ? (
          <AnimatePresence mode="popLayout">
            {vehiclesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[300px] bg-slate-900 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-red-500/20 bg-red-500/5">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-red-400 mb-2">Error</h3>
                <p className="text-red-400/80">Failed to load vehicles. Please try again.</p>
              </div>
            ) : filteredVehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVehicles.map((vehicle, idx) => (
                  <VehicleCard key={idx} vehicle={vehicle} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-white/5 bg-slate-900/30">
                <Search className="h-12 w-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Vehicles Found</h3>
                <p className="text-slate-500">Try adjusting your search.</p>
              </div>
            )}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center py-40">
            <Car className="h-16 w-16 text-slate-600 mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Select a Vehicle Type</h3>
            <p className="text-slate-400">Choose a type above to see available vehicles.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleListing;
