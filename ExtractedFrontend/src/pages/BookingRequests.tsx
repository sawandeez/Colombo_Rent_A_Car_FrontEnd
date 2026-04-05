import React from 'react';
import type { AxiosError } from 'axios';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Calendar,
    CheckCircle2,
    Eye,
    ExternalLink,
    FileText,
    Filter,
    Loader2,
    Search,
    XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import type {
    BookingAdminDTO,
    BookingAdminListResponse,
    BookingAdminStatus,
    Vehicle,
} from '../types';
import { cn, formatPrice } from '../utils';

type BookingListResult = {
    items: BookingAdminDTO[];
    totalPages: number;
    totalElements: number;
};

type AdminUserDocument = {
    id: string;
    category: string;
    originalFilename?: string;
    contentType?: string;
    createdAt?: string;
};

type AdminUserDetails = {
    id: string;
    name?: string;
    email?: string;
    username?: string;
};

type AdminVehicleRate = Pick<Vehicle, 'id' | 'rentalPricePerDay'>;

const STATUS_OPTIONS: BookingAdminStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const PAGE_SIZE = 10;

const normalizeBookingList = (data: BookingAdminListResponse): BookingListResult => {
    if (Array.isArray(data)) {
        return {
            items: data,
            totalPages: 1,
            totalElements: data.length,
        };
    }

    const items = Array.isArray(data.content) ? data.content : [];
    return {
        items,
        totalPages: Math.max(data.totalPages || 1, 1),
        totalElements: data.totalElements ?? items.length,
    };
};

const toDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
};

const getBookingId = (booking: BookingAdminDTO) => booking.id || booking.bookingId || '';
const getCustomerName = (booking: BookingAdminDTO) => (
    booking.user?.name || booking.customerName || booking.user?.username || 'Unknown Customer'
);
const getCustomerEmail = (booking: BookingAdminDTO) => (
    booking.user?.email || booking.customerEmail || '-'
);
const getCustomerId = (booking: BookingAdminDTO) => booking.user?.id || booking.userId || '';
const getVehicleIdValue = (booking: BookingAdminDTO) => booking.vehicle?.id || booking.vehicleId || '';
const getVehicleId = (booking: BookingAdminDTO) => getVehicleIdValue(booking) || '-';
const getVehicleName = (booking: BookingAdminDTO) => {
    if (booking.vehicleName) return booking.vehicleName;
    const make = booking.vehicle?.make || '';
    const model = booking.vehicle?.model || '';
    const combined = `${make} ${model}`.trim();
    return combined || 'Unknown Vehicle';
};
const getPickupDateTime = (booking: BookingAdminDTO) => booking.pickupDateTime || booking.startDate;
const getReturnDateTime = (booking: BookingAdminDTO) => booking.returnDateTime || booking.endDate;
const getCreatedDateTime = (booking: BookingAdminDTO) => booking.createdAt || booking.bookingTime;
const getTotalPriceValue = (booking: BookingAdminDTO) => booking.totalPrice ?? booking.totalAmount;
const getBookingDurationDays = (booking: BookingAdminDTO) => {
    const pickupDateTime = getPickupDateTime(booking);
    const returnDateTime = getReturnDateTime(booking);
    if (!pickupDateTime || !returnDateTime) return undefined;

    const pickup = new Date(pickupDateTime);
    const dropOff = new Date(returnDateTime);
    if (Number.isNaN(pickup.getTime()) || Number.isNaN(dropOff.getTime())) return undefined;

    const milliseconds = dropOff.getTime() - pickup.getTime();
    if (milliseconds <= 0) return 1;

    return Math.max(1, Math.ceil(milliseconds / (1000 * 60 * 60 * 24)));
};

const StatusBadge: React.FC<{ status: BookingAdminStatus }> = ({ status }) => {
    const styles = {
        PENDING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        CONFIRMED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
        CANCELLED: 'bg-surface-800 text-surface-400 border-white/5',
        COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    }[status] || 'bg-surface-800 text-surface-400 border-white/5';

    return (
        <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border', styles)}>
            {status}
        </span>
    );
};

const getErrorMessage = (error: unknown) => {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError?.response?.status === 403) return 'You do not have permission to view booking approvals.';
    if (axiosError?.response?.status === 500) return 'Server error while loading booking approvals. Please retry.';
    return axiosError?.response?.data?.message || 'Failed to load booking approvals.';
};

const BookingRequests: React.FC = () => {
    const queryClient = useQueryClient();

    const [statusFilter, setStatusFilter] = React.useState<BookingAdminStatus>('PENDING');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [fromDate, setFromDate] = React.useState('');
    const [toDate, setToDate] = React.useState('');
    const [page, setPage] = React.useState(1);
    const [selectedBooking, setSelectedBooking] = React.useState<BookingAdminDTO | null>(null);
    const selectedCustomerId = selectedBooking ? getCustomerId(selectedBooking) : '';
    const needsCustomerDetailsFallback = Boolean(
        selectedBooking &&
        selectedCustomerId &&
        !selectedBooking.user?.name &&
        !selectedBooking.customerName
    );

    const { data, isLoading, isFetching, error } = useQuery<BookingListResult>({
        queryKey: ['admin-bookings-approvals', statusFilter, page, searchQuery, fromDate, toDate],
        queryFn: async () => {
            const response = await api.get<BookingAdminListResponse>('/admin/bookings', {
                params: {
                    status: statusFilter,
                    page: page - 1,
                    size: PAGE_SIZE,
                    search: searchQuery || undefined,
                    fromDate: fromDate || undefined,
                    toDate: toDate || undefined,
                },
            });
            return normalizeBookingList(response.data);
        },
        placeholderData: (previousData) => previousData,
    });

    const approveMutation = useMutation({
        mutationFn: async (bookingId: string) => api.patch(`/admin/bookings/${bookingId}/approve`),
        onSuccess: () => {
            toast.success('Booking approved successfully.');
            queryClient.invalidateQueries({ queryKey: ['admin-bookings-approvals'] });
            setSelectedBooking(null);
        },
        onError: (mutationError: unknown) => {
            toast.error(getErrorMessage(mutationError));
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => (
            api.patch(`/admin/bookings/${bookingId}/reject`, reason ? { reason } : {})
        ),
        onSuccess: () => {
            toast.success('Booking rejected successfully.');
            queryClient.invalidateQueries({ queryKey: ['admin-bookings-approvals'] });
            setSelectedBooking(null);
        },
        onError: (mutationError: unknown) => {
            toast.error(getErrorMessage(mutationError));
        },
    });

    const {
        data: selectedUserDocuments = [],
        isLoading: isUserDocumentsLoading,
        error: userDocumentsError,
    } = useQuery<AdminUserDocument[]>({
        queryKey: ['admin-user-documents', selectedCustomerId],
        queryFn: async () => {
            const response = await api.get<AdminUserDocument[]>(`/admin/users/${selectedCustomerId}/documents`);
            return response.data;
        },
        enabled: Boolean(selectedCustomerId),
    });

    const { data: selectedUserDetails } = useQuery<AdminUserDetails>({
        queryKey: ['admin-user-details', selectedCustomerId],
        queryFn: async () => {
            const response = await api.get<AdminUserDetails>(`/admin/users/${selectedCustomerId}`);
            return response.data;
        },
        enabled: needsCustomerDetailsFallback,
    });

    const selectedCustomerName = selectedBooking
        ? (selectedUserDetails?.name || selectedUserDetails?.username || getCustomerName(selectedBooking))
        : 'Unknown Customer';

    const selectedCustomerEmail = selectedBooking
        ? (selectedUserDetails?.email || getCustomerEmail(selectedBooking))
        : '-';

    const bookings = data?.items || [];
    const filteredBookings = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return bookings.filter((booking) => {
            const bookingId = getBookingId(booking).toLowerCase();
            const customerName = getCustomerName(booking).toLowerCase();
            const customerEmail = getCustomerEmail(booking).toLowerCase();
            const vehicleName = getVehicleName(booking).toLowerCase();
            const vehicleId = getVehicleId(booking).toLowerCase();

            const matchesSearch = !query ||
                bookingId.includes(query) ||
                customerName.includes(query) ||
                customerEmail.includes(query) ||
                vehicleName.includes(query) ||
                vehicleId.includes(query);

            if (!matchesSearch) return false;

            const createdAt = getCreatedDateTime(booking);
            if (!createdAt) return !fromDate && !toDate;
            const createdDate = new Date(createdAt);
            if (Number.isNaN(createdDate.getTime())) return true;

            if (fromDate) {
                const from = new Date(fromDate);
                from.setHours(0, 0, 0, 0);
                if (createdDate < from) return false;
            }

            if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                if (createdDate > to) return false;
            }

            return true;
        });
    }, [bookings, fromDate, searchQuery, toDate]);

    const totalPages = data?.totalPages || 1;
    const totalElements = data?.totalElements || filteredBookings.length;

    const rowCustomerIdsNeedingFallback = React.useMemo(() => {
        const ids = filteredBookings
            .filter((booking) => !booking.user?.name && !booking.customerName)
            .map((booking) => getCustomerId(booking))
            .filter(Boolean);
        return Array.from(new Set(ids));
    }, [filteredBookings]);

    const rowCustomerQueries = useQueries({
        queries: rowCustomerIdsNeedingFallback.map((customerId) => ({
            queryKey: ['admin-user-details-row', customerId],
            queryFn: async () => {
                const response = await api.get<AdminUserDetails>(`/admin/users/${customerId}`);
                return response.data;
            },
        })),
    });

    const rowCustomerMap = React.useMemo(() => {
        const map = new Map<string, AdminUserDetails>();
        rowCustomerIdsNeedingFallback.forEach((customerId, index) => {
            const userDetails = rowCustomerQueries[index]?.data;
            if (userDetails) {
                map.set(customerId, userDetails);
            }
        });
        return map;
    }, [rowCustomerIdsNeedingFallback, rowCustomerQueries]);

    const getRowCustomerName = (booking: BookingAdminDTO) => {
        const customerId = getCustomerId(booking);
        const fallbackUser = customerId ? rowCustomerMap.get(customerId) : undefined;
        return fallbackUser?.name || fallbackUser?.username || getCustomerName(booking);
    };

    const getRowCustomerEmail = (booking: BookingAdminDTO) => {
        const customerId = getCustomerId(booking);
        const fallbackUser = customerId ? rowCustomerMap.get(customerId) : undefined;
        return fallbackUser?.email || getCustomerEmail(booking);
    };

    const rowVehicleIdsNeedingTotalFallback = React.useMemo(() => {
        const ids = filteredBookings
            .filter((booking) => typeof getTotalPriceValue(booking) !== 'number')
            .map((booking) => getVehicleIdValue(booking))
            .filter(Boolean);
        return Array.from(new Set(ids));
    }, [filteredBookings]);

    const rowVehicleQueries = useQueries({
        queries: rowVehicleIdsNeedingTotalFallback.map((vehicleId) => ({
            queryKey: ['admin-vehicle-rate-row', vehicleId],
            queryFn: async () => {
                const response = await api.get<AdminVehicleRate>(`/vehicles/${vehicleId}`);
                return response.data;
            },
            staleTime: 5 * 60 * 1000,
        })),
    });

    const rowVehicleMap = React.useMemo(() => {
        const map = new Map<string, AdminVehicleRate>();
        rowVehicleIdsNeedingTotalFallback.forEach((vehicleId, index) => {
            const vehicleDetails = rowVehicleQueries[index]?.data;
            if (vehicleDetails) {
                map.set(vehicleId, vehicleDetails);
            }
        });
        return map;
    }, [rowVehicleIdsNeedingTotalFallback, rowVehicleQueries]);

    const getDisplayTotalPrice = (booking: BookingAdminDTO) => {
        const directTotal = getTotalPriceValue(booking);
        if (typeof directTotal === 'number') return directTotal;

        const vehicleId = getVehicleIdValue(booking);
        const rentalPricePerDay = vehicleId ? rowVehicleMap.get(vehicleId)?.rentalPricePerDay : undefined;
        const bookingDays = getBookingDurationDays(booking);

        if (typeof rentalPricePerDay === 'number' && typeof bookingDays === 'number') {
            return rentalPricePerDay * bookingDays;
        }

        return undefined;
    };

    const handleStatusChange = (status: BookingAdminStatus) => {
        setStatusFilter(status);
        setPage(1);
    };

    const handleReject = (bookingId: string) => {
        const reason = window.prompt('Enter rejection reason (optional):') || '';
        rejectMutation.mutate({ bookingId, reason: reason.trim() || undefined });
    };

    const handleOpenUserDocument = async (documentId: string) => {
        if (!selectedCustomerId) return;

        try {
            const response = await api.get<Blob>(`/admin/users/${selectedCustomerId}/documents/${documentId}`, {
                responseType: 'blob',
            });
            const objectUrl = URL.createObjectURL(response.data);
            window.open(objectUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="min-h-screen pb-20 pt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-left">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold">Booking Approvals</h1>
                        <p className="text-surface-400">Review, filter, and process booking requests.</p>
                    </div>
                    {isFetching && !isLoading && (
                        <div className="text-xs text-surface-500 flex items-center gap-2 font-medium">
                            <Loader2 className="h-4 w-4 animate-spin" /> Refreshing...
                        </div>
                    )}
                </div>

                <div className="glass-card !p-6 bg-surface-900/40 space-y-6">
                    <div className="flex flex-wrap gap-3">
                        {STATUS_OPTIONS.map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={cn(
                                    'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors',
                                    statusFilter === status
                                        ? 'bg-primary-600/20 border-primary-500/40 text-primary-300'
                                        : 'bg-white/5 border-white/10 text-surface-400 hover:text-white hover:bg-white/10'
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative lg:col-span-2">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search by booking ID, customer, vehicle"
                                className="input-field pl-12"
                            />
                        </div>

                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    setPage(1);
                                }}
                                className="input-field pl-12"
                                aria-label="From date"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    setPage(1);
                                }}
                                className="input-field pl-12"
                                aria-label="To date"
                            />
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="glass-card !bg-red-500/10 border-red-500/20 !p-6 text-red-300 text-sm">
                        {getErrorMessage(error)}
                    </div>
                ) : isLoading ? (
                    <div className="glass-card !p-0 overflow-hidden bg-surface-900/40">
                        <div className="divide-y divide-white/5">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div key={item} className="h-16 animate-pulse bg-white/5" />
                            ))}
                        </div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="glass-card !p-10 text-center space-y-3 bg-surface-900/40">
                        <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
                        <h3 className="text-lg font-bold text-white">No pending booking requests</h3>
                        <p className="text-sm text-surface-500">Try changing filters or search terms.</p>
                    </div>
                ) : (
                    <>
                        <div className="glass-card !p-0 overflow-x-auto bg-surface-900/40">
                            <table className="w-full min-w-[1100px] text-left">
                                <thead className="bg-white/5 border-b border-white/5">
                                    <tr>
                                        <th className="p-4 text-[10px] font-bold uppercase text-surface-500 tracking-wider">Booking ID</th>
                                        <th className="p-4 text-[10px] font-bold uppercase text-surface-500 tracking-wider">Customer</th>
                                        <th className="p-4 text-[10px] font-bold uppercase text-surface-500 tracking-wider">Vehicle</th>
                                        <th className="p-4 text-[10px] font-bold uppercase text-surface-500 tracking-wider">Pickup</th>
                                        <th className="p-4 text-[10px] font-bold uppercase text-surface-500 tracking-wider">Return</th>
                                        <th className="p-4 text-[10px] font-bold uppercase text-surface-500 tracking-wider">Total</th>
                                        <th className="p-4 text-[10px] font-bold uppercase text-surface-500 tracking-wider">Status</th>
                                        <th className="p-4 text-[10px] font-bold uppercase text-surface-500 tracking-wider">Created</th>
                                        <th className="p-4 text-[10px] font-bold uppercase text-surface-500 tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredBookings.map((booking) => {
                                        const bookingId = getBookingId(booking);
                                        const isPending = booking.status === 'PENDING';
                                        const totalPrice = getDisplayTotalPrice(booking);

                                        return (
                                            <tr key={bookingId} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-xs font-mono text-white">#{bookingId.slice(-8).toUpperCase()}</td>
                                                <td className="p-4">
                                                    <div className="text-sm font-medium text-white">{getRowCustomerName(booking)}</div>
                                                    <div className="text-xs text-surface-500">{getRowCustomerEmail(booking)}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-white">{getVehicleName(booking)}</div>
                                                    <div className="text-xs text-surface-500">ID: {getVehicleId(booking)}</div>
                                                </td>
                                                <td className="p-4 text-xs text-surface-300">{toDateTime(getPickupDateTime(booking))}</td>
                                                <td className="p-4 text-xs text-surface-300">{toDateTime(getReturnDateTime(booking))}</td>
                                                <td className="p-4 text-sm text-white">{typeof totalPrice === 'number' ? formatPrice(totalPrice) : '-'}</td>
                                                <td className="p-4"><StatusBadge status={booking.status} /></td>
                                                <td className="p-4 text-xs text-surface-400">{toDateTime(getCreatedDateTime(booking))}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            className="btn-outline !py-1.5 !px-3 text-xs flex items-center gap-1"
                                                            onClick={() => setSelectedBooking(booking)}
                                                        >
                                                            <Eye className="h-4 w-4" /> View
                                                        </button>
                                                        <button
                                                            className="btn-primary !py-1.5 !px-3 text-xs !bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                                                            onClick={() => approveMutation.mutate(bookingId)}
                                                            disabled={!isPending || approveMutation.isPending || rejectMutation.isPending}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            className="btn-outline !py-1.5 !px-3 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                                                            onClick={() => handleReject(bookingId)}
                                                            disabled={!isPending || approveMutation.isPending || rejectMutation.isPending}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between text-sm text-surface-400 px-2">
                            <span>
                                Showing {filteredBookings.length} item(s) • Total {totalElements}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn-outline !py-1.5 !px-3 text-xs"
                                    disabled={page <= 1 || isFetching}
                                    onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                                >
                                    Previous
                                </button>
                                <span className="text-xs font-bold uppercase tracking-wider text-surface-500">Page {page} / {totalPages}</span>
                                <button
                                    className="btn-outline !py-1.5 !px-3 text-xs"
                                    disabled={page >= totalPages || isFetching}
                                    onClick={() => setPage((previous) => previous + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <AnimatePresence>
                {selectedBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-surface-950/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="bg-surface-900 w-full max-w-lg h-full rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-l border-white/10"
                        >
                            <div className="p-8 flex justify-between items-center bg-white/5">
                                <h3 className="text-2xl font-bold">Booking Details</h3>
                                <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-white/10 rounded-full">
                                    <XCircle className="h-6 w-6 text-surface-500" />
                                </button>
                            </div>

                            <div className="p-8 flex-grow overflow-y-auto space-y-5 text-left text-sm">
                                <div className="glass-card !bg-white/5 !p-4 space-y-3">
                                    <div><span className="text-surface-500">Booking ID:</span> <span className="font-mono">{getBookingId(selectedBooking)}</span></div>
                                    <div><span className="text-surface-500">Customer:</span> {selectedCustomerName}</div>
                                    <div><span className="text-surface-500">Email:</span> {selectedCustomerEmail}</div>
                                    <div><span className="text-surface-500">Vehicle:</span> {getVehicleName(selectedBooking)} (ID: {getVehicleId(selectedBooking)})</div>
                                    <div><span className="text-surface-500">Pickup:</span> {toDateTime(getPickupDateTime(selectedBooking))}</div>
                                    <div><span className="text-surface-500">Return:</span> {toDateTime(getReturnDateTime(selectedBooking))}</div>
                                    <div>
                                        <span className="text-surface-500">Total:</span>{' '}
                                        {typeof getDisplayTotalPrice(selectedBooking) === 'number'
                                            ? formatPrice(getDisplayTotalPrice(selectedBooking) as number)
                                            : '-'}
                                    </div>
                                    <div><span className="text-surface-500">Created:</span> {toDateTime(getCreatedDateTime(selectedBooking))}</div>
                                    <div>
                                        <span className="text-surface-500">Status:</span>{' '}
                                        <StatusBadge status={selectedBooking.status} />
                                    </div>
                                </div>

                                <div className="glass-card !bg-white/5 !p-4 space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400 flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Uploaded Documents
                                    </h4>

                                    {!selectedCustomerId ? (
                                        <p className="text-xs text-surface-500">Customer ID is unavailable for this booking.</p>
                                    ) : isUserDocumentsLoading ? (
                                        <p className="text-xs text-surface-500 animate-pulse">Loading user documents...</p>
                                    ) : userDocumentsError ? (
                                        <p className="text-xs text-red-300">Unable to load user documents.</p>
                                    ) : selectedUserDocuments.length === 0 ? (
                                        <p className="text-xs text-surface-500">No uploaded documents found.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedUserDocuments.map((document) => (
                                                <div key={document.id} className="flex items-center justify-between bg-surface-900/40 border border-white/5 rounded-xl px-3 py-2">
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-semibold text-white truncate">{document.originalFilename || 'Document file'}</div>
                                                        <div className="text-[10px] text-surface-500 uppercase tracking-wider">
                                                            {document.category} {document.createdAt ? `• ${toDateTime(document.createdAt)}` : ''}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenUserDocument(document.id)}
                                                        className="btn-outline !py-1 !px-3 text-[10px] inline-flex items-center gap-1"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" /> Open
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-2 gap-4 bg-white/5">
                                <button
                                    onClick={() => handleReject(getBookingId(selectedBooking))}
                                    disabled={selectedBooking.status !== 'PENDING' || rejectMutation.isPending || approveMutation.isPending}
                                    className="btn-outline !py-4 flex items-center justify-center gap-2 border-red-500/20 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                                >
                                    <XCircle className="h-5 w-5" /> Reject
                                </button>
                                <button
                                    onClick={() => approveMutation.mutate(getBookingId(selectedBooking))}
                                    disabled={selectedBooking.status !== 'PENDING' || rejectMutation.isPending || approveMutation.isPending}
                                    className="btn-primary !py-4 flex items-center justify-center gap-2 !bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                                >
                                    <CheckCircle2 className="h-5 w-5" /> Approve
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BookingRequests;
