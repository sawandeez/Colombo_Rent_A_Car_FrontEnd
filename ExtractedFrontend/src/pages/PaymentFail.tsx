import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Booking } from '../types';
import { getBooking } from '../services/bookings';
import { initiatePayment, startPaymentCheckout } from '../services/paymentsApi';

const PaymentFail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const bookingId = searchParams.get('bookingId') || '';

    const [booking, setBooking] = React.useState<Booking | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isRetrying, setIsRetrying] = React.useState(false);

    React.useEffect(() => {
        let active = true;

        const fetchBooking = async () => {
            if (!bookingId) return;
            setIsLoading(true);

            try {
                const latest = await getBooking(bookingId);
                if (!active) return;
                setBooking(latest);
            } catch {
                if (!active) return;
                toast.error('Unable to load booking status right now.');
            } finally {
                if (active) setIsLoading(false);
            }
        };

        void fetchBooking();

        return () => {
            active = false;
        };
    }, [bookingId]);

    const paymentStatusText = booking?.paymentStatus || (booking?.advancePaid ? 'SUCCESS' : 'PENDING');
    const paymentDateText = booking?.paymentDate || '-';

    const handleRetry = async () => {
        if (!bookingId) {
            toast.error('Booking ID is missing. Please retry payment from profile.');
            return;
        }

        setIsRetrying(true);
        try {
            const origin = window.location.origin;
            const response = await initiatePayment(bookingId, {
                returnUrl: `${origin}/payment/success?bookingId=${bookingId}`,
                cancelUrl: `${origin}/payment/fail?bookingId=${bookingId}`,
            });
            startPaymentCheckout(response);
        } catch {
            toast.error('Unable to start payment. Please try again.');
            setIsRetrying(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="glass-card text-center space-y-6 leading-normal">
                    <div className="inline-flex p-4 rounded-2xl bg-red-500/10 text-red-400 mx-auto">
                        <AlertTriangle className="h-10 w-10" />
                    </div>

                    <h1 className="text-3xl font-bold">Payment failed / cancelled. Please try again.</h1>
                    <p className="text-surface-400 text-sm">
                        Your booking is still available in your profile. You can start the payment again from there.
                    </p>

                    {!bookingId && (
                        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-orange-300 text-sm">
                            Missing bookingId in return URL. Open your profile to find the booking.
                        </div>
                    )}

                    {isLoading && <p className="text-sm text-surface-400">Loading latest booking details...</p>}

                    {booking && (
                        <div className="text-left rounded-2xl border border-white/10 bg-surface-900/50 p-5 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-surface-500">Booking ID</span>
                                <span className="font-mono text-surface-200">{booking.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-surface-500">Booking Status</span>
                                <span className="text-white font-semibold">{booking.status || 'UNKNOWN'}</span>
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

                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                            onClick={() => {
                                void handleRetry();
                            }}
                            disabled={isRetrying}
                            className="btn-primary !py-2 !px-4 text-xs font-bold disabled:opacity-60"
                        >
                            {isRetrying ? 'Starting...' : 'Retry Pay Advance'}
                        </button>
                        <Link to="/profile" className="btn-primary !py-2 !px-4 text-xs font-bold">
                            Back To Profile
                        </Link>
                        <Link to="/vehicles" className="btn-outline !py-2 !px-4 text-xs font-bold">
                            Browse Vehicles
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentFail;
