import React from 'react';
import type { AxiosError } from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, FileUp, Landmark, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Booking } from '../types';
import { formatDate, formatPrice } from '../utils';
import { getMyBookings } from '../services/bookings';
import {
    isValidReceiptFile,
    RECEIPT_ACCEPT_ATTRIBUTE,
    RECEIPT_INVALID_FILE_MESSAGE,
    uploadPaymentReceipt,
} from '../services/paymentsApi';

type ReceiptFormState = {
    bankName: string;
    bankBranch: string;
    amount: string;
    file: File | null;
    fileError: string | null;
};

const createInitialFormState = (booking: Booking | null): ReceiptFormState => ({
    bankName: '',
    bankBranch: '',
    amount: typeof booking?.advanceAmount === 'number' ? booking.advanceAmount.toFixed(2) : '',
    file: null,
    fileError: null,
});

const UploadReceipt: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const bookingId = searchParams.get('bookingId');

    const getApiErrorMessage = (error: unknown, fallback: string) => {
        const axiosError = error as AxiosError<{ message?: string }>;
        const status = axiosError?.response?.status;

        if (status === 401) return 'Please login';
        if (status === 403) return 'Access denied';
        if (status === 400) return axiosError?.response?.data?.message || fallback;

        return axiosError?.response?.data?.message || fallback;
    };

    const { data: bookings = [], isLoading } = useQuery<Booking[]>({
        queryKey: ['my-bookings'],
        queryFn: getMyBookings,
    });

    const selectedBooking = React.useMemo(() => {
        if (!bookingId) return null;
        return bookings.find((booking) => booking.id === bookingId) ?? null;
    }, [bookings, bookingId]);

    const [form, setForm] = React.useState<ReceiptFormState>(createInitialFormState(null));

    React.useEffect(() => {
        setForm(createInitialFormState(selectedBooking));
    }, [selectedBooking?.id, selectedBooking?.advanceAmount]);

    const receiptMutation = useMutation({
        mutationFn: async () => {
            if (!bookingId) {
                throw new Error('Booking ID is missing.');
            }

            const bankName = form.bankName.trim();
            const bankBranch = form.bankBranch.trim();
            const amountValue = Number(form.amount);

            if (!bankName || !bankBranch || !form.amount.trim()) {
                throw new Error('Bank name, branch, and amount are required.');
            }

            if (!Number.isFinite(amountValue) || amountValue <= 0) {
                throw new Error('Please enter a valid amount.');
            }

            if (!form.file) {
                throw new Error('Please attach a payment receipt file.');
            }

            if (!isValidReceiptFile(form.file)) {
                throw new Error(RECEIPT_INVALID_FILE_MESSAGE);
            }

            await uploadPaymentReceipt(bookingId, {
                bankName,
                bankBranch,
                amount: amountValue,
                file: form.file,
            });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            toast.success('Receipt uploaded successfully.');
            navigate('/profile');
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, 'Unable to upload receipt. Please try again.'));
        },
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] ?? null;

        if (!selectedFile) {
            setForm((current) => ({ ...current, file: null, fileError: null }));
            return;
        }

        if (!isValidReceiptFile(selectedFile)) {
            setForm((current) => ({ ...current, file: null, fileError: RECEIPT_INVALID_FILE_MESSAGE }));
            event.target.value = '';
            toast.error(RECEIPT_INVALID_FILE_MESSAGE);
            return;
        }

        setForm((current) => ({ ...current, file: selectedFile, fileError: null }));
    };

    const submitReceipt = () => {
        void receiptMutation.mutateAsync();
    };

    const isAllowedStatus = selectedBooking && ['APPROVED', 'CONFIRMED'].includes(selectedBooking.status);

    if (!bookingId) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="glass-card text-left space-y-4">
                        <h1 className="text-2xl font-bold">Upload Payment Receipt</h1>
                        <p className="text-sm text-surface-400">No booking was selected. Please start from your dashboard.</p>
                        <Link to="/profile" className="btn-primary w-fit !py-2 !px-4 text-xs font-bold">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Upload Payment Receipt</h1>
                    <Link to="/profile" className="btn-outline !py-2 !px-4 text-xs inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </div>

                {isLoading ? (
                    <div className="glass-card h-32 animate-pulse bg-surface-900/50" />
                ) : !selectedBooking ? (
                    <div className="glass-card !py-10 text-center space-y-3">
                        <AlertCircle className="h-7 w-7 text-red-400 mx-auto" />
                        <p className="text-sm text-red-300">Booking not found. Please retry from your dashboard.</p>
                    </div>
                ) : !isAllowedStatus ? (
                    <div className="glass-card !py-10 text-center space-y-3">
                        <AlertCircle className="h-7 w-7 text-orange-400 mx-auto" />
                        <p className="text-sm text-orange-300">Receipt upload is only available for approved or confirmed bookings.</p>
                    </div>
                ) : (
                    <div className="glass-card space-y-6 text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-white/10 bg-surface-900/60 p-4">
                                <div className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">Booking ID</div>
                                <div className="text-sm font-mono text-surface-300 mt-1">#{selectedBooking.id.slice(-8).toUpperCase()}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-surface-900/60 p-4">
                                <div className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">Advance Amount</div>
                                <div className="text-sm font-semibold text-emerald-400 mt-1">
                                    {typeof selectedBooking.advanceAmount === 'number'
                                        ? formatPrice(selectedBooking.advanceAmount)
                                        : 'Not set yet'}
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-surface-900/60 p-4 sm:col-span-2">
                                <div className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">Booking Period</div>
                                <div className="text-sm text-surface-300 mt-1">
                                    {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <label className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Bank Name</span>
                                <input
                                    type="text"
                                    value={form.bankName}
                                    onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))}
                                    placeholder="Commercial Bank"
                                    className="w-full rounded-xl border border-white/10 bg-surface-950 px-3 py-2 text-sm text-white outline-none transition focus:border-primary-500"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Branch</span>
                                <input
                                    type="text"
                                    value={form.bankBranch}
                                    onChange={(event) => setForm((current) => ({ ...current, bankBranch: event.target.value }))}
                                    placeholder="Colombo Main"
                                    className="w-full rounded-xl border border-white/10 bg-surface-950 px-3 py-2 text-sm text-white outline-none transition focus:border-primary-500"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Amount</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                                    placeholder="0.00"
                                    className="w-full rounded-xl border border-white/10 bg-surface-950 px-3 py-2 text-sm text-white outline-none transition focus:border-primary-500"
                                />
                            </label>
                        </div>

                        <label className="block space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Payment Slip</span>
                            <input
                                type="file"
                                accept={RECEIPT_ACCEPT_ATTRIBUTE}
                                onChange={handleFileChange}
                                className="block w-full rounded-xl border border-dashed border-white/15 bg-surface-950 px-3 py-3 text-sm text-surface-300 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-primary-500"
                            />
                            <div className="text-xs text-surface-500">Accepted file types: JPG, JPEG, PNG, PDF.</div>
                            {form.file && !form.fileError && (
                                <div className="text-xs text-emerald-400">Selected file: {form.file.name}</div>
                            )}
                            {form.fileError && (
                                <div className="text-xs text-red-400">{form.fileError}</div>
                            )}
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={submitReceipt}
                                disabled={receiptMutation.isPending}
                                className="btn-primary !py-2 !px-4 text-xs font-bold disabled:opacity-60 inline-flex items-center gap-2"
                            >
                                <FileUp className="h-4 w-4" />
                                {receiptMutation.isPending ? 'Uploading...' : 'Submit Receipt'}
                            </button>
                            <Link to="/profile" className="btn-outline !py-2 !px-4 text-xs">
                                Cancel
                            </Link>
                        </div>

                        <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-3 text-xs text-primary-200 flex items-start gap-2">
                            <Landmark className="h-4 w-4 mt-0.5 shrink-0" />
                            Receipt is attached to your user account and this booking for admin verification.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadReceipt;
