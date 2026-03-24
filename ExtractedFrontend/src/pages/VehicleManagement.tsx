import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, Edit3, Trash2,
    X, Camera, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import type { Vehicle } from '../types';
import { formatPrice } from '../utils';

const VehicleManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingVehicle, setEditingVehicle] = React.useState<Partial<Vehicle> | null>(null);

    const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
        queryKey: ['admin-vehicles'],
        queryFn: async () => {
            const response = await api.get('/vehicles');
            return response.data;
        }
    });

    const saveMutation = useMutation({
        mutationFn: (data: Partial<Vehicle>) =>
            data.id ? api.put(`/vehicles/${data.id}`, data) : api.post('/vehicles', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
            toast.success(editingVehicle?.id ? 'Vehicle updated' : 'Vehicle added');
            setIsModalOpen(false);
            setEditingVehicle(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
            toast.success('Vehicle removed from fleet');
        }
    });

    const filteredVehicles = vehicles.filter(v =>
        v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.make.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen pb-20 pt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-left">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold">Fleet Management</h1>
                        <p className="text-surface-400">Inventory control and vehicle maintenance scheduling.</p>
                    </div>
                    <button
                        onClick={() => { setEditingVehicle({}); setIsModalOpen(true); }}
                        className="btn-primary flex items-center gap-2 !py-4 !px-6 font-bold"
                    >
                        <Plus className="h-5 w-5" /> Add New Vehicle
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                        <input
                            type="text"
                            placeholder="Search fleet..."
                            className="input-field pl-12"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="btn-outline flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filter
                    </button>
                </div>

                {/* Fleet Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {isLoading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="glass-card h-80 animate-pulse bg-surface-900/40" />)
                    ) : filteredVehicles.map(vehicle => (
                        <motion.div
                            key={vehicle.id}
                            layout
                            className="glass-card group flex flex-col justify-between hover:border-primary-500/50 transition-all bg-surface-900/40"
                        >
                            <div className="relative aspect-[16/10] bg-surface-800 rounded-2xl overflow-hidden mb-4">
                                <img src={vehicle.imageUrls?.[0] || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute top-3 left-3 flex gap-2">
                                    {!vehicle.isAvailable && (
                                        <span className="px-2 py-1 bg-red-500/80 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm">BOOKED</span>
                                    )}
                                    {vehicle.isUnderMaintenance && (
                                        <span className="px-2 py-1 bg-orange-500/80 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm">REPAIR</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-start text-left">
                                    <div>
                                        <h4 className="font-bold text-lg">{vehicle.make} {vehicle.model}</h4>
                                        <p className="text-xs text-surface-500 uppercase font-bold tracking-widest">{vehicle.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-primary-400">{formatPrice(vehicle.rentalPricePerDay)}</div>
                                        <div className="text-[10px] text-surface-500 uppercase">Per Day</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        onClick={() => { setEditingVehicle(vehicle); setIsModalOpen(true); }}
                                        className="flex-grow btn-outline !py-2 flex items-center justify-center gap-2 text-xs font-bold"
                                    >
                                        <Edit3 className="h-4 w-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('Are you sure?')) deleteMutation.mutate(vehicle.id); }}
                                        className="btn-outline !py-2 !px-3 border-red-500/20 text-red-500 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Modal - Simplified Form */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-surface-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10"
                        >
                            <div className="p-8 flex justify-between items-center border-b border-white/5">
                                <h3 className="text-2xl font-bold">{editingVehicle?.id ? 'Edit Vehicle' : 'Register New Vehicle'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                    <X className="h-6 w-6 text-surface-500" />
                                </button>
                            </div>

                            <div className="p-8 grid grid-cols-2 gap-6 text-left overflow-y-auto max-h-[70vh]">
                                <div className="space-y-2">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Make</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Toyota"
                                        defaultValue={editingVehicle?.make}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, make: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Model</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Prius"
                                        defaultValue={editingVehicle?.model}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Type</label>
                                    <select
                                        className="input-field"
                                        defaultValue={editingVehicle?.type}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, type: e.target.value as any })}
                                    >
                                        <option value="CAR">Car</option>
                                        <option value="VAN">Van</option>
                                        <option value="SUV">SUV</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Daily Rate (LKR)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        defaultValue={editingVehicle?.rentalPricePerDay}
                                        onChange={(e) => setEditingVehicle({ ...editingVehicle, rentalPricePerDay: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-4">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Primary Image URL</label>
                                    <div className="relative">
                                        <input
                                            className="input-field pl-12"
                                            placeholder="https://images.unsplash.com..."
                                            defaultValue={editingVehicle?.imageUrls?.[0]}
                                            onChange={(e) => setEditingVehicle({ ...editingVehicle, imageUrls: [e.target.value] })}
                                        />
                                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                                    </div>
                                </div>

                                <div className="col-span-2 flex gap-4 pt-4 leading-normal">
                                    <label className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl cursor-pointer border border-white/10 hover:border-primary-500/50 flex-grow">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-primary-500"
                                            defaultChecked={editingVehicle?.isUnderMaintenance}
                                            onChange={(e) => setEditingVehicle({ ...editingVehicle, isUnderMaintenance: e.target.checked })}
                                        />
                                        <div>
                                            <p className="text-sm font-bold">Under Maintenance</p>
                                            <p className="text-[10px] text-surface-500">Hide from customers during repairs</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="p-8 bg-white/5 flex justify-end gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="btn-outline !py-4 !px-8">Cancel</button>
                                <button
                                    onClick={() => saveMutation.mutate(editingVehicle || {})}
                                    className="btn-primary !py-4 !px-8 flex items-center gap-2"
                                >
                                    <Save className="h-5 w-5" /> {editingVehicle?.id ? 'Update Vehicle' : 'Register Vehicle'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VehicleManagement;
