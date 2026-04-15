import api from './api';
import type { Booking, AdminBookingDetailsResponse } from '../types';

export const getMyBookings = async (): Promise<Booking[]> => {
    const response = await api.get<Booking[]>('/bookings/my');
    return response.data;
};

export const getBooking = async (id: string): Promise<Booking> => {
    const response = await api.get<Booking>(`/bookings/${id}`);
    return response.data;
};

export const cancelBooking = async (id: string): Promise<void> => {
    await api.delete(`/bookings/${id}`);
};

export const setAdvanceAmount = async (
    bookingId: string,
    advanceAmount: number,
    advanceCurrency?: string,
): Promise<void> => {
    await api.put(`/admin/bookings/${bookingId}/advance-amount`, { advanceAmount, advanceCurrency });
};

export const getAdminBookingDetails = async (id: string): Promise<AdminBookingDetailsResponse> => {
    const response = await api.get<AdminBookingDetailsResponse>(`/admin/bookings/${id}/details`);
    return response.data;
};
