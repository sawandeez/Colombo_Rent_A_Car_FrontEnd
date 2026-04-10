import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Phone, MapPin, Calendar,
    Clock, AlertCircle,
    Trash2, ExternalLink, Car
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Booking } from '../types';
import { cn, formatDate, formatPrice } from '../utils';
import { useAuthStore } from '../store/authStore';
import { cancelBooking, getMyBookings } from '../services/bookings';
import { initiatePayment, startPaymentCheckout } from '../services/paymentsApi';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles = {
        PENDING: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
        CANCELLED: "bg-surface-800 text-surface-400 border-white/5",
        COMPLETED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    }[status] || "bg-surface-800 text-surface-400";

    return (
        <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", styles)}>
            {status}
        </span>
    );
};

const Profile: React.FC = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [initiatingBookingId, setInitiatingBookingId] = React.useState<string | null>(null);

    const getApiErrorMessage = (error: unknown, fallback: string) => {
        const axiosError = error as AxiosError<{ message?: string }>;
        const status = axiosError?.response?.status;
        if (status === 401) return 'Please login';
        if (status === 403) return 'Access denied';
        if (status === 400) return axiosError?.response?.data?.message || fallback;
        return axiosError?.response?.data?.message || fallback;
    };

    const { data: bookings = [], isLoading, error } = useQuery<Booking[]>({
        queryKey: ['my-bookings'],
        queryFn: getMyBookings,
    });

    const cancelMutation = useMutation({
        mutationFn: cancelBooking,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            toast.success('Booking cancelled successfully');
        },
        onError: (mutationError: unknown) => {
            toast.error(getApiErrorMessage(mutationError, 'Failed to cancel booking'));
        },
    });

    const canAttemptPayment = (booking: Booking): boolean => {
        const normalizedPayment = (booking.paymentStatus || '').toString().toUpperCase();
        const alreadyPaid = booking.advancePaid === true || normalizedPayment === 'SUCCESS';

        if (alreadyPaid) return false;
        return ['APPROVED', 'CONFIRMED'].includes(booking.status);
    };

    const handlePayAdvance = async (booking: Booking) => {
        setInitiatingBookingId(booking.id);

        try {
            const origin = window.location.origin;
            const response = await initiatePayment(booking.id, {
                returnUrl: `${origin}/payment/success?bookingId=${booking.id}`,
                cancelUrl: `${origin}/payment/fail?bookingId=${booking.id}`,
            });

            startPaymentCheckout(response);
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, 'Unable to start payment. Please try again.'));
        } finally {
            setInitiatingBookingId(null);
        }
    };

    const ongoingBookings = bookings.filter(b => ['PENDING', 'APPROVED', 'CONFIRMED'].includes(b.status));
    const historyBookings = bookings.filter(b => !['PENDING', 'APPROVED', 'CONFIRMED'].includes(b.status));

    return (
        <div className="min-h-screen pb-20 pt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                {/* Header / User Info */}
                <div className="glass-card relative overflow-hidden flex flex-col md:flex-row items-center gap-8 bg-surface-900/40 !p-10 leading-normal">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 blur-[100px] rounded-full" />

                    <div className="relative">
                        <div className="w-24 h-24 bg-primary-600 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-primary-600/20">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        {!user?.documentsVerified && (
                            <div className="absolute -bottom-2 -right-2 bg-orange-500 p-1.5 rounded-full border-4 border-surface-900" title="Verification Pending">
                                <AlertCircle className="h-4 w-4 text-white" />
                            </div>
                        )}
                    </div>

                    <div className="text-center md:text-left space-y-2 flex-grow relative z-10">
                        <h1 className="text-3xl font-bold">{user?.name}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-surface-400">
                            <div className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {user?.email}</div>
                            <div className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {user?.phone}</div>
                            <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {user?.city}, {user?.district}</div>
                        </div>
                    </div>

                    <div className="flex gap-3 relative z-10">
                        <Link to="/profile/edit" className="btn-outline !py-2 !px-4 text-xs">Edit Profile</Link>
                        <button className="btn-primary !py-2 !px-4 text-xs font-bold">Verification Docs</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Ongoing Bookings */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Clock className="h-6 w-6 text-primary-500" />
                                Ongoing Reservations
                            </h2>
                            <span className="text-xs font-bold text-surface-500 bg-surface-900 px-3 py-1 rounded-full uppercase tracking-tighter">
                                {ongoingBookings.length} Active
                            </span>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => <div key={i} className="glass-card h-32 animate-pulse bg-surface-900/50" />)}
                                </div>
                            ) : error ? (
                                <div className="glass-card !py-16 text-center space-y-4">
                                    <div className="bg-red-500/10 p-4 rounded-full inline-block">
                                        <AlertCircle className="h-8 w-8 text-red-400" />
                                    </div>
                                    <p className="text-red-300 text-sm">{getApiErrorMessage(error, 'Failed to load bookings')}</p>
                                </div>
                            ) : ongoingBookings.length > 0 ? (
                                ongoingBookings.map((booking) => (
                                    <motion.div
                                        key={booking.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="glass-card flex flex-col md:flex-row gap-6 hover:border-primary-500/30 transition-all leading-normal"
                                    >
                                        <div className="w-full md:w-48 aspect-[16/10] bg-surface-800 rounded-xl overflow-hidden shrink-0">
                                            <img src={booking.vehicle?.imageUrls?.[0]} className="w-full h-full object-cover" />
                                        </div>

                                        <div className="flex-grow space-y-4 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div className="text-left">
                                                    <h4 className="font-bold text-lg">{booking.vehicle?.make} {booking.vehicle?.model}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-surface-500 mt-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <StatusBadge status={booking.status} />
                                                    {booking.paymentStatus && (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 bg-blue-500/10 text-blue-300">
                                                            Payment: {booking.paymentStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="text-left">
                                                    <div className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">Booking ID</div>
                                                    <div className="text-xs font-medium font-mono text-surface-300">#{booking.id?.slice(-8)?.toUpperCase() || 'N/A'}</div>
                                                </div>
                                                {booking.status === 'APPROVED' && (
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">Advance Amount</div>
                                                        {typeof booking.advanceAmount === 'number' ? (
                                                            <div className="text-xs font-bold text-emerald-400">{formatPrice(booking.advanceAmount)}</div>
                                                        ) : (
                                                            <div className="text-xs text-surface-500">Not set yet</div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    {canAttemptPayment(booking) && (
                                                        <button
                                                            onClick={() => {
                                                                void handlePayAdvance(booking);
                                                            }}
                                                            disabled={initiatingBookingId === booking.id}
                                                            className="btn-primary !py-2 !px-3 text-[10px] font-bold disabled:opacity-60 !bg-red-600 !border-red-600 hover:!bg-red-700 !text-white"
                                                        >
                                                            {initiatingBookingId === booking.id ? 'Starting...' : 'Pay Advance'}
                                                        </button>
                                                    )}
                                                    {booking.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => cancelMutation.mutate(booking.id)}
                                                            className="p-2 text-surface-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Cancel Booking"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    <Link to={`/vehicles/${booking.vehicleId}`} className="p-2 text-surface-500 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all">
                                                        <ExternalLink className="h-5 w-5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="glass-card !py-16 text-center space-y-4">
                                    <div className="bg-white/5 p-4 rounded-full inline-block">
                                        <Calendar className="h-8 w-8 text-surface-600" />
                                    </div>
                                    <p className="text-surface-500 text-sm">No active bookings yet.</p>
                                    <Link to="/vehicles" className="text-primary-500 font-bold hover:underline block">Browse Fleet</Link>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar / Stats & History */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Clock className="h-6 w-6 text-primary-500" />
                            History
                        </h2>

                        <div className="glass-card !p-0 leading-normal divide-y divide-white/5">
                            {historyBookings.length > 0 ? (
                                historyBookings.map((booking) => (
                                    <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="bg-surface-800 p-2 rounded-lg">
                                                <Car className="h-4 w-4 text-surface-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold">{booking.vehicle?.make} {booking.vehicle?.model}</div>
                                                <div className="text-[10px] text-surface-500">{formatDate(booking.startDate)}</div>
                                            </div>
                                        </div>
                                        <StatusBadge status={booking.status} />
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center text-[10px] text-surface-600 uppercase tracking-widest font-bold">
                                    No previous activity
                                </div>
                            )}
                        </div>

                        {/* Notification Card */}
                        <div className="glass-card !bg-orange-600/10 border-orange-500/20 !p-6 flex items-start space-x-4 leading-normal">
                            <AlertCircle className="h-6 w-6 text-orange-400 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-orange-400 mb-1 text-left">Account Verification</h4>
                                <p className="text-[10px] text-orange-400/80 leading-relaxed text-left">
                                    Please ensure your documents are updated. Your profile will be verified by our team within 24 hours of your first booking.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
