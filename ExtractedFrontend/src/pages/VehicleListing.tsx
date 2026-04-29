import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Car, Fuel, Users, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Vehicle } from '../types';
import { cn, formatPrice } from '../utils';

const VehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
    const isUnavailable = !vehicle.isAvailable || vehicle.isUnderMaintenance || vehicle.isAdminHeld;
    const primaryImage = vehicle.imageUrls?.[0] || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "glass-card p-0 overflow-hidden flex flex-col group h-full",
                isUnavailable && "opacity-60 grayscale-[0.5]"
            )}
        >
            <div className="relative aspect-[16/10] overflow-hidden bg-surface-800">
                <img
                    src={primaryImage}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {isUnavailable && (
                    <div className="absolute inset-0 bg-surface-950/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                            Currently Unavailable
                        </span>
                    </div>
                )}
                <div className="absolute top-4 left-4">
                    <span className="bg-primary-600/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        {vehicle.type}
                    </span>
                </div>
            </div>

            <div className="p-6 space-y-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                            {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-sm text-surface-500">{vehicle.year} Model</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-primary-400">{formatPrice(vehicle.rentalPricePerDay)}</div>
                        <div className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">Per Day</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                    <div className="flex items-center space-x-2 text-surface-400">
                        <Users className="h-4 w-4 text-primary-500" />
                        <span className="text-xs">4 Passengers</span>
                    </div>
                    <div className="flex items-center space-x-2 text-surface-400">
                        <Gauge className="h-4 w-4 text-primary-500" />
                        <span className="text-xs">Automatic</span>
                    </div>
                    <div className="flex items-center space-x-2 text-surface-400">
                        <Fuel className="h-4 w-4 text-primary-500" />
                        <span className="text-xs">Petrol</span>
                    </div>
                    <div className="flex items-center space-x-2 text-surface-400">
                        <Car className="h-4 w-4 text-primary-500" />
                        <span className="text-xs">Air Con</span>
                    </div>
                </div>

                <div className="pt-2 mt-auto">
                    {isUnavailable ? (
                        <button disabled className="w-full btn-outline border-white/5 bg-white/5 text-surface-500">
                            Not Available
                        </button>
                    ) : (
                        <Link to={`/vehicles/${vehicle.id}`} className="w-full btn-primary block text-center">
                            View Details
                        </Link>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const VehicleListing: React.FC = () => {
    const [filterType, setFilterType] = React.useState('All');
    const [searchQuery, setSearchQuery] = React.useState('');

    const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const response = await api.get('/vehicles');
            const rawVehicles = Array.isArray(response.data) ? response.data : [];
            return rawVehicles.map((vehicle: Vehicle) => ({
                ...vehicle,
                imageUrls: Array.isArray(vehicle.imageUrls) ? vehicle.imageUrls : [],
            }));
        },
    });

    const filteredVehicles = vehicles
        .filter(v =>
            (filterType === 'All' || v.type === filterType) &&
            (`${v.make} ${v.model}`.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => (Number(b.isAvailable) - Number(a.isAvailable))); // Available first

    const typeMap = new Map<string, string>();
    vehicles.forEach((v) => {
        const normalizedType = String(v.type ?? '').trim().toLowerCase();
        if (normalizedType && !typeMap.has(normalizedType)) {
            typeMap.set(normalizedType, v.type);
        }
    });
    const types = ['All', ...typeMap.values()];

    return (
        <div className="min-h-screen pb-20 pt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold">Explore Our Fleet</h1>
                        <p className="text-surface-400">Choose from our premium selection of vehicles.</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-primary-600/10 text-primary-400 px-4 py-2 rounded-xl border border-primary-500/20 text-sm font-medium">
                        <Car className="h-4 w-4" />
                        <span>{filteredVehicles.length} Vehicles Available</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                            <input
                                type="text"
                                placeholder="Search by make or model..."
                                className="input-field pl-12"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 font-medium">
                            {types.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={cn(
                                        "px-6 py-3 rounded-xl transition-all whitespace-nowrap text-sm",
                                        filterType === type
                                            ? "bg-primary-600 text-surface-950 shadow-lg shadow-primary-600/20"
                                            : "bg-surface-900 border border-white/5 text-surface-400 hover:text-white hover:border-white/10"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-end">
                        <button className="flex items-center space-x-2 text-surface-400 hover:text-white transition-colors text-sm font-medium pr-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            <span>More Filters</span>
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="glass-card h-[400px] animate-pulse !bg-surface-900/50" />
                            ))}
                        </div>
                    ) : filteredVehicles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 leading-normal">
                            {filteredVehicles.map(vehicle => (
                                <VehicleCard key={vehicle.id} vehicle={vehicle} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 glass-card">
                            <div className="bg-white/5 p-6 rounded-3xl mb-6">
                                <Search className="h-12 w-12 text-surface-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No Vehicles Found</h3>
                            <p className="text-surface-500">Try adjusting your filters or search terms.</p>
                            <button
                                onClick={() => { setFilterType('All'); setSearchQuery(''); }}
                                className="mt-6 text-primary-500 hover:underline font-semibold"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VehicleListing;
