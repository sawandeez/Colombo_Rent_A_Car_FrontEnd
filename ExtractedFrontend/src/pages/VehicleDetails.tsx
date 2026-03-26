import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Star, Clock, Shield, Calendar,
    Users, Fuel, Gauge, CheckCircle2, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import type { Vehicle } from '../types';
import { formatPrice, cn } from '../utils';
import { useAuthStore } from '../store/authStore';

const VehicleDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [activeImage, setActiveImage] = React.useState(0);

    const { data: vehicle, isLoading, error } = useQuery<Vehicle>({
        queryKey: ['vehicle', id],
        queryFn: async () => {
            const response = await api.get(`/vehicles/${id}`);
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500" />
            </div>
        );
    }

    if (error || !vehicle) {
        return (
            <div className="min-h-screen pt-40 px-4 text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold mb-4">Vehicle Not Found</h1>
                <p className="text-surface-400 mb-8">The vehicle you are looking for might have been removed or is currently unavailable.</p>
                <Link to="/vehicles" className="btn-primary">Back to Fleet</Link>
            </div>
        );
    }

    const isUnavailable = !vehicle.isAvailable || vehicle.isUnderMaintenance || vehicle.isAdminHeld;
    const galleryImages = vehicle.imageUrls?.length
        ? vehicle.imageUrls
        : ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1200"];

    return (
        <div className="min-h-screen pb-24 pt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="mb-8">
                    <Link to="/vehicles" className="flex items-center space-x-2 text-surface-400 hover:text-white transition-colors group">
                        <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-medium">Back to All Vehicles</span>
                    </Link>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start text-left">
                    {/* Gallery */}
                    <div className="space-y-6">
                        <motion.div
                            layoutId={`img-${vehicle.id}`}
                            className="relative aspect-[16/10] bg-surface-900 rounded-[2rem] overflow-hidden border border-white/5"
                        >
                            <img
                                src={galleryImages[activeImage] || galleryImages[0]}
                                alt={vehicle.model}
                                className="w-full h-full object-cover"
                            />
                            {isUnavailable && (
                                <div className="absolute inset-0 bg-surface-950/40 backdrop-blur-sm flex items-center justify-center">
                                    <div className="bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest backdrop-blur-md">
                                        Not Available for Booking
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-4 gap-4 leading-normal">
                            {galleryImages.map((url, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={cn(
                                        "aspect-square rounded-2xl overflow-hidden border-2 transition-all",
                                        activeImage === idx ? "border-primary-500 scale-95" : "border-transparent opacity-50 hover:opacity-100"
                                    )}
                                >
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>

                        {/* Features/Specs Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 leading-normal">
                            {[
                                { icon: <Users className="h-5 w-5 text-primary-500" />, label: "7 Seats" },
                                { icon: <Gauge className="h-5 w-5 text-primary-500" />, label: "Automatic" },
                                { icon: <Fuel className="h-5 w-5 text-primary-500" />, label: "Petrol" },
                                { icon: <Clock className="h-5 w-5 text-primary-500" />, label: "20km/L" },
                            ].map((spec, i) => (
                                <div key={i} className="glass-card !p-4 flex flex-col items-center text-center space-y-2 !bg-surface-900/30">
                                    {spec.icon}
                                    <span className="text-xs font-medium text-surface-400">{spec.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info & Booking Card */}
                    <div className="space-y-8 lg:sticky lg:top-24">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <span className="px-3 py-1 bg-primary-600/10 text-primary-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary-500/20">
                                    {vehicle.type}
                                </span>
                                <div className="flex items-center text-yellow-500">
                                    <Star className="h-4 w-4 fill-current" />
                                    <span className="text-sm font-bold ml-1">4.9 (120 reviews)</span>
                                </div>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                                {vehicle.make} {vehicle.model}
                            </h1>

                            <p className="text-surface-400 leading-relaxed text-lg">
                                {vehicle.description || "Indulge in a perfect blend of style, performance, and luxury. This vehicle is meticulously maintained to ensure your safety and comfort throughout your journey across Sri Lanka."}
                            </p>
                        </div>

                        <div className="glass-card !p-8 space-y-8 bg-surface-900/40">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-sm text-surface-500 font-medium uppercase tracking-wider mb-1">Rental Price</div>
                                    <div className="text-4xl font-bold text-white">
                                        {formatPrice(vehicle.rentalPricePerDay)}
                                        <span className="text-lg text-surface-500 font-normal ml-2">/Day</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-secondary-400 font-bold mb-1">FREE CANCELLATION</div>
                                    <div className="text-[10px] text-surface-500">Up to 24h before pickup</div>
                                </div>
                            </div>

                            <div className="space-y-4 leading-normal">
                                <div className="flex items-center space-x-3 text-sm text-surface-300">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <span>Comprehensive Insurance Included</span>
                                </div>
                                <div className="flex items-center space-x-3 text-sm text-surface-300">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <span>24/7 Roadside Assistance</span>
                                </div>
                                <div className="flex items-center space-x-3 text-sm text-surface-300 text-left">
                                    <Shield className="h-5 w-5 text-emerald-500" />
                                    <span>Secure Online Payment</span>
                                </div>
                            </div>

                            <div className="pt-4 leading-normal">
                                {isUnavailable ? (
                                    <button disabled className="w-full py-4 bg-surface-800 text-surface-500 rounded-2xl font-bold cursor-not-allowed">
                                        Currently Booked / Held
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(isAuthenticated ? `/booking?vehicle=${vehicle.id}` : '/login')}
                                        className="w-full btn-primary py-5 rounded-2xl text-lg flex items-center justify-center space-x-3 active:scale-[0.98]"
                                    >
                                        <Calendar className="h-6 w-6" />
                                        <span>Reserve This Vehicle</span>
                                    </button>
                                )}
                                <p className="text-center text-xs text-surface-500 mt-4 leading-normal">
                                    No hidden fees. Best price guaranteed in Colombo.
                                </p>
                            </div>
                        </div>

                        {/* Mini Calendar/Info Section */}
                        <div className="glass-card !p-6 flex items-start space-x-4 !bg-orange-500/5 border-orange-500/10 leading-normal">
                            <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-orange-400 mb-1">Notice for Renters</h4>
                                <p className="text-xs text-orange-400/80 leading-relaxed">
                                    A valid driving license and ID verification are required for all rentals.
                                    An advance payment of 25% is mandatory upon booking approval.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleDetails;
