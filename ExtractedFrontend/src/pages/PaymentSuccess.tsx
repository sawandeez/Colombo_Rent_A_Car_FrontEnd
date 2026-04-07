import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Booking } from '../types';
import { getBooking } from '../services/bookings';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 30000;

const isConfirmedPayment = (booking: Booking | null): boolean => {
    if (!booking) return false;

    const normalizedPaymentStatus = (booking.paymentStatus || '').toString().toUpperCase();
    const normalizedBookingStatus = (booking.status || '').toString().toUpperCase();

    const paymentSucceeded = normalizedPaymentStatus === 'SUCCESS' || booking.advancePaid === true;
    const bookingConfirmed = normalizedBookingStatus === 'CONFIRMED';

    return paymentSucceeded && bookingConfirmed;
};

const PaymentSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const bookingId = searchParams.get('bookingId') || '';

    const [booking, setBooking] = React.useState<Booking | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isPolling, setIsPolling] = React.useState(false);
    const [pollTimedOut, setPollTimedOut] = React.useState(false);

    React.useEffect(() => {
        let active = true;

        const run = async () => {
            if (!bookingId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const firstResult = await getBooking(bookingId);
                if (!active) return;

                setBooking(firstResult);
                setIsLoading(false);

                if (isConfirmedPayment(firstResult)) {
                    return;
                }

                setIsPolling(true);
                const pollStart = Date.now();

                while (Date.now() - pollStart < MAX_POLL_DURATION_MS) {
                    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
                    if (!active) return;

                    const latest = await getBooking(bookingId);
                    if (!active) return;

                    setBooking(latest);
                    if (isConfirmedPayment(latest)) {
                        setIsPolling(false);
                        return;
                    }
                }

                setPollTimedOut(true);
                setIsPolling(false);
            } catch {
                if (!active) return;
                toast.error('Unable to load booking status right now.');
                setIsLoading(false);
                setIsPolling(false);
            }
        };

        void run();

        return () => {
            active = false;
        };
    }, [bookingId]);

    const statusText = booking?.status || 'UNKNOWN';
    const paymentStatusText = booking?.paymentStatus || (booking?.advancePaid ? 'SUCCESS' : 'PENDING');
    const paymentDateText = booking?.paymentDate || '-';

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="glass-card text-center space-y-6 leading-normal">
                    <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>

                    <h1 className="text-3xl font-bold">Payment successful (pending confirmation)...</h1>
                    <p className="text-surface-400 text-sm">
                        We received your return from the gateway. Your booking will be marked once backend verification completes.
                    </p>

                    {!bookingId && (
                        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-orange-300 text-sm">
                            Missing bookingId in return URL. Please check your booking status from Profile.
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 text-surface-300 text-sm">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Loading latest booking status...
                        </div>
                    )}

                    {!isLoading && booking && (
                        <div className="text-left rounded-2xl border border-white/10 bg-surface-900/50 p-5 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-surface-500">Booking ID</span>
                                <span className="font-mono text-surface-200">{booking.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-surface-500">Booking Status</span>
                                <span className="text-white font-semibold">{statusText}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-surface-500">Payment Status</span>
                                <span className="text-white font-semibold">{paymentStatusText}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-surface-500">Payment Date</span>
                                <span className="text-white font-semibold">{paymentDateText}</span>
                            </div>
                        </div>
                    )}

                    {isPolling && (
                        <div className="flex items-center justify-center gap-2 text-primary-300 text-sm">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Waiting for backend confirmation...
                        </div>
                    )}

                    {pollTimedOut && (
                        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-200 text-sm text-left">
                            Confirmation is taking longer than expected. Refresh this page later or check your booking in Profile.
                        </div>
                    )}

                    {!isLoading && !isPolling && booking && isConfirmedPayment(booking) && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200 text-sm">
                            Booking payment is now confirmed.
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-3 pt-2">
                        <Link to="/profile" className="btn-primary !py-2 !px-4 text-xs font-bold">
                            Go To Profile
                        </Link>
                        <Link to="/vehicles" className="btn-outline !py-2 !px-4 text-xs font-bold">
                            Browse Vehicles
                        </Link>
                    </div>

                    <div className="flex items-start justify-center gap-2 text-[11px] text-surface-500">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>Final confirmation depends on backend webhook verification.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
