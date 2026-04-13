import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Edit3, Trash2,
    X, Camera, Save, AlertTriangle
} from 'lucide-react';
import type { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import api from '../services/api';
import type { Vehicle } from '../types';
import { formatPrice } from '../utils';

type VehicleFormData = {
    make: string;
    model: string;
    year: string;
    type: string;
    description: string;
    rentalPricePerDay: string;
    imageUrl: string;
    isAvailable: boolean;
    isUnderMaintenance: boolean;
    isAdminHeld: boolean;
};

type VehicleFormErrors = Partial<Record<keyof VehicleFormData, string>>;

type VehicleUpsertPayload = {
    name: string;
    thumbnailUrl: string;
    make: string;
    model: string;
    year: number;
    type: string;
    description: string;
    rentalPricePerDay: number;
    imageUrls: string[];
    isAvailable: boolean;
    isUnderMaintenance: boolean;
    isAdminHeld: boolean;
};

const INITIAL_FORM_DATA: VehicleFormData = {
    make: '',
    model: '',
    year: '',
    type: 'SEDAN',
    description: '',
    rentalPricePerDay: '',
    imageUrl: '',
    isAvailable: true,
    isUnderMaintenance: false,
    isAdminHeld: false,
};

const toFormData = (vehicle?: Vehicle | null): VehicleFormData => {
    if (!vehicle) return INITIAL_FORM_DATA;

    return {
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year ? String(vehicle.year) : '',
        type: vehicle.type || 'SEDAN',
        description: vehicle.description || '',
        rentalPricePerDay: vehicle.rentalPricePerDay ? String(vehicle.rentalPricePerDay) : '',
        imageUrl: vehicle.imageUrls?.[0] || '',
        isAvailable: vehicle.isAvailable ?? true,
        isUnderMaintenance: vehicle.isUnderMaintenance ?? false,
        isAdminHeld: vehicle.isAdminHeld ?? false,
    };
};

const validateForm = (form: VehicleFormData): VehicleFormErrors => {
    const errors: VehicleFormErrors = {};

    if (!form.make.trim()) errors.make = 'Make is required.';
    if (!form.model.trim()) errors.model = 'Model is required.';
    if (!form.type.trim()) errors.type = 'Type is required.';
    if (!form.description.trim()) errors.description = 'Description is required.';
    if (!form.imageUrl.trim()) errors.imageUrl = 'Primary image URL is required.';

    const year = Number(form.year);
    if (!form.year.trim()) {
        errors.year = 'Year is required.';
    } else if (!Number.isInteger(year) || year < 1990 || year > 2100) {
        errors.year = 'Year must be between 1990 and 2100.';
    }

    const price = Number(form.rentalPricePerDay);
    if (!form.rentalPricePerDay.trim()) {
        errors.rentalPricePerDay = 'Daily rate is required.';
    } else if (!Number.isFinite(price) || price <= 0) {
        errors.rentalPricePerDay = 'Daily rate must be greater than 0.';
    }

    return errors;
};

const VehicleManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
    const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<Vehicle | null>(null);
    const [form, setForm] = React.useState<VehicleFormData>(INITIAL_FORM_DATA);
    const [formErrors, setFormErrors] = React.useState<VehicleFormErrors>({});

    const getApiErrorMessage = (error: unknown, fallback: string): string => {
        const axiosError = error as AxiosError<{ message?: string }>;
        return axiosError?.response?.data?.message || fallback;
    };

    const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
        queryKey: ['admin-vehicles'],
        queryFn: async () => {
            const response = await api.get('/vehicles');
            const rawVehicles = Array.isArray(response.data) ? response.data : [];
            return rawVehicles
                .filter((item): item is Partial<Vehicle> => Boolean(item && typeof item === 'object'))
                .map((item) => ({
                    id: String(item.id || ''),
                    make: item.make || '',
                    model: item.model || '',
                    year: Number(item.year) || new Date().getFullYear(),
                    type: item.type || 'UNKNOWN',
                    description: item.description || '',
                    rentalPricePerDay: Number(item.rentalPricePerDay) || 0,
                    imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls.filter(Boolean) : [],
                    isAvailable: Boolean(item.isAvailable),
                    isUnderMaintenance: Boolean(item.isUnderMaintenance),
                    isAdminHeld: Boolean(item.isAdminHeld),
                } as Vehicle));
        },
    });

    const saveMutation = useMutation({
        mutationFn: async ({ id, payload }: { id?: string; payload: VehicleUpsertPayload }) => {
            if (id) {
                await api.put(`/vehicles/${id}`, payload);
                return;
            }
            await api.post('/vehicles', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
            toast.success(selectedVehicle?.id ? 'Vehicle updated successfully.' : 'Vehicle created successfully.');
            setIsFormModalOpen(false);
            setSelectedVehicle(null);
            setForm(INITIAL_FORM_DATA);
            setFormErrors({});
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to save vehicle.'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
            toast.success('Vehicle deleted successfully.');
            setDeleteTarget(null);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to delete vehicle.'));
        },
    });

    const handleOpenCreate = () => {
        setSelectedVehicle(null);
        setForm(INITIAL_FORM_DATA);
        setFormErrors({});
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setForm(toFormData(vehicle));
        setFormErrors({});
        setIsFormModalOpen(true);
    };

    const handleChange = <K extends keyof VehicleFormData>(key: K, value: VehicleFormData[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
        setFormErrors((current) => ({ ...current, [key]: undefined }));
    };

    const handleSave = () => {
        const errors = validateForm(form);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            toast.error('Please fix validation errors before submitting.');
            return;
        }

        const make = form.make.trim();
        const model = form.model.trim();
        const primaryImageUrl = form.imageUrl.trim();

        const payload: VehicleUpsertPayload = {
            name: `${make} ${model}`.trim(),
            thumbnailUrl: primaryImageUrl,
            make,
            model,
            year: Number(form.year),
            type: form.type.trim(),
            description: form.description.trim(),
            rentalPricePerDay: Number(form.rentalPricePerDay),
            imageUrls: [primaryImageUrl],
            isAvailable: form.isAvailable,
            isUnderMaintenance: form.isUnderMaintenance,
            isAdminHeld: form.isAdminHeld,
        };

        saveMutation.mutate({ id: selectedVehicle?.id, payload });
    };

    const filteredVehicles = vehicles.filter((v) => {
        const model = (v.model || '').toLowerCase();
        const make = (v.make || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return model.includes(query) || make.includes(query);
    });

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
                        onClick={handleOpenCreate}
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
                </div>

                {/* Fleet Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {isLoading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="glass-card h-80 animate-pulse bg-surface-900/40" />)
                    ) : filteredVehicles.length > 0 ? filteredVehicles.map(vehicle => (
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
                                    {vehicle.isAdminHeld && (
                                        <span className="px-2 py-1 bg-purple-500/80 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm">ADMIN HOLD</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-start text-left">
                                    <div>
                                        <h4 className="font-bold text-lg">{vehicle.make} {vehicle.model}</h4>
                                        <p className="text-xs text-surface-500 uppercase font-bold tracking-widest">{vehicle.type} • {vehicle.year}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-primary-400">{formatPrice(vehicle.rentalPricePerDay)}</div>
                                        <div className="text-[10px] text-surface-500 uppercase">Per Day</div>
                                    </div>
                                </div>

                                <div className="text-xs text-surface-400 line-clamp-2">{vehicle.description || 'No description provided.'}</div>

                                <div className="text-[10px] uppercase tracking-widest font-bold text-surface-500">
                                    {vehicle.isAvailable ? 'Available' : 'Unavailable'}
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        onClick={() => handleOpenEdit(vehicle)}
                                        className="flex-grow btn-outline !py-2 flex items-center justify-center gap-2 text-xs font-bold"
                                    >
                                        <Edit3 className="h-4 w-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(vehicle)}
                                        className="btn-outline !py-2 !px-3 border-red-500/20 text-red-500 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-span-full glass-card !py-16 text-center">
                            <p className="text-surface-500">No vehicles found for your search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {isFormModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-surface-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10"
                        >
                            <div className="p-8 flex justify-between items-center border-b border-white/5">
                                <h3 className="text-2xl font-bold">{selectedVehicle?.id ? 'Edit Vehicle' : 'Create Vehicle'}</h3>
                                <button
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-full"
                                >
                                    <X className="h-6 w-6 text-surface-500" />
                                </button>
                            </div>

                            <div className="p-8 grid grid-cols-2 gap-6 text-left overflow-y-auto max-h-[70vh]">
                                <div className="space-y-2">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Make</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Toyota"
                                        value={form.make}
                                        onChange={(e) => handleChange('make', e.target.value)}
                                    />
                                    {formErrors.make && <p className="text-red-400 text-xs">{formErrors.make}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Model</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Prius"
                                        value={form.model}
                                        onChange={(e) => handleChange('model', e.target.value)}
                                    />
                                    {formErrors.model && <p className="text-red-400 text-xs">{formErrors.model}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Year</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="e.g. 2024"
                                        value={form.year}
                                        onChange={(e) => handleChange('year', e.target.value)}
                                    />
                                    {formErrors.year && <p className="text-red-400 text-xs">{formErrors.year}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Type</label>
                                    <select
                                        className="input-field"
                                        value={form.type}
                                        onChange={(e) => handleChange('type', e.target.value)}
                                    >
                                        <option value="SUV">SUV</option>
                                        <option value="SEDAN">Sedan</option>
                                        <option value="VAN">Van</option>
                                    </select>
                                    {formErrors.type && <p className="text-red-400 text-xs">{formErrors.type}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Daily Rate (LKR)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={form.rentalPricePerDay}
                                        onChange={(e) => handleChange('rentalPricePerDay', e.target.value)}
                                    />
                                    {formErrors.rentalPricePerDay && <p className="text-red-400 text-xs">{formErrors.rentalPricePerDay}</p>}
                                </div>
                                <div className="col-span-2 space-y-4">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Primary Image URL</label>
                                    <div className="relative">
                                        <input
                                            className="input-field pl-12"
                                            placeholder="https://images.unsplash.com..."
                                            value={form.imageUrl}
                                            onChange={(e) => handleChange('imageUrl', e.target.value)}
                                        />
                                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                                    </div>
                                    {formErrors.imageUrl && <p className="text-red-400 text-xs">{formErrors.imageUrl}</p>}
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs text-surface-500 font-bold uppercase tracking-widest">Description</label>
                                    <textarea
                                        className="input-field min-h-28"
                                        placeholder="Vehicle description"
                                        value={form.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                    />
                                    {formErrors.description && <p className="text-red-400 text-xs">{formErrors.description}</p>}
                                </div>

                                <div className="col-span-2 flex gap-4 pt-4 leading-normal">
                                    <label className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl cursor-pointer border border-white/10 hover:border-primary-500/50 flex-grow">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-primary-500"
                                            checked={form.isAvailable}
                                            onChange={(e) => handleChange('isAvailable', e.target.checked)}
                                        />
                                        <div>
                                            <p className="text-sm font-bold">Available for Booking</p>
                                            <p className="text-[10px] text-surface-500">Customer can request this vehicle</p>
                                        </div>
                                    </label>
                                </div>

                                <div className="col-span-2 flex gap-4 leading-normal">
                                    <label className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl cursor-pointer border border-white/10 hover:border-primary-500/50 flex-grow">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-primary-500"
                                            checked={form.isUnderMaintenance}
                                            onChange={(e) => handleChange('isUnderMaintenance', e.target.checked)}
                                        />
                                        <div>
                                            <p className="text-sm font-bold">Under Maintenance</p>
                                            <p className="text-[10px] text-surface-500">Hide from customers during repairs</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl cursor-pointer border border-white/10 hover:border-primary-500/50 flex-grow">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-primary-500"
                                            checked={form.isAdminHeld}
                                            onChange={(e) => handleChange('isAdminHeld', e.target.checked)}
                                        />
                                        <div>
                                            <p className="text-sm font-bold">Admin Hold</p>
                                            <p className="text-[10px] text-surface-500">Temporarily hold without deleting</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="p-8 bg-white/5 flex justify-end gap-4">
                                <button onClick={() => setIsFormModalOpen(false)} className="btn-outline !py-4 !px-8">Cancel</button>
                                <button
                                    onClick={handleSave}
                                    disabled={saveMutation.isPending}
                                    className="btn-primary !py-4 !px-8 flex items-center gap-2 disabled:opacity-60"
                                >
                                    <Save className="h-5 w-5" />
                                    {saveMutation.isPending ? 'Saving...' : selectedVehicle?.id ? 'Update Vehicle' : 'Create Vehicle'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-surface-900 p-8 space-y-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-red-500/10 text-red-400">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Delete Vehicle</h3>
                                    <p className="text-sm text-surface-400 mt-1">
                                        Are you sure you want to delete {deleteTarget.make} {deleteTarget.model}? This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    className="btn-outline !py-2 !px-4 text-xs"
                                    onClick={() => setDeleteTarget(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary !py-2 !px-4 text-xs !bg-red-600 !border-red-600 hover:!bg-red-700 disabled:opacity-60"
                                    onClick={() => deleteMutation.mutate(deleteTarget.id)}
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Vehicle'}
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
