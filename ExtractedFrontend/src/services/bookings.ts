import api from './api';
import type { Booking } from '../types';

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
