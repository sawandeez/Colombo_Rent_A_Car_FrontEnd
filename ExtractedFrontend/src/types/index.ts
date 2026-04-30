// HIDDEN_CONCEPT:2OP-Abs
export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SPECIAL_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  district: string;
  city: string;
  role: UserRole;
  documentsVerified: boolean;
}

export interface AuthResponse {
  token: string;
  role: string;
}

export type BookingStatus = 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'PAYMENT_VERIFIED';
export type PaymentStatus = 'PENDING' | 'INITIATED' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING_VERIFICATION' | 'VERIFIED';

export type BookingAdminStatus = BookingStatus;

export interface Vehicle {
  id: string;
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
}

export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  bookingTime: string;
  status: BookingStatus;
  advanceAmount?: number;
  advancePaid?: boolean;
  paymentStatus?: PaymentStatus | string;
  paymentDate?: string;
  rejectionReason?: string;
  receiptUploaded?: boolean;
  receiptUploadedAt?: string;
  vehicle?: Vehicle; // Nested DTO from backend
}

export interface BookingAdminCustomer {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
}

export interface BookingAdminVehicle {
  id?: string;
  make?: string;
  model?: string;
}

export interface BookingAdminDTO {
  id?: string;
  bookingId?: string;
  status: BookingAdminStatus;
  startDate?: string;
  endDate?: string;
  pickupDateTime?: string;
  returnDateTime?: string;
  bookingTime?: string;
  createdAt?: string;
  totalPrice?: number;
  totalAmount?: number;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  user?: BookingAdminCustomer;
  vehicleId?: string;
  vehicleName?: string;
  vehicle?: BookingAdminVehicle;
  advanceAmount?: number;
  advanceCurrency?: string;
  paymentStatus?: PaymentStatus | string;
  paymentDate?: string;
  rejectionReason?: string;
  receiptUploaded?: boolean;
  receiptUploadedAt?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export type BookingAdminListResponse = BookingAdminDTO[] | PaginatedResponse<BookingAdminDTO>;

export interface DocumentDto {
  documentId?: string;
  documentType: string;
  originalFilename?: string;
  uploadedAt?: string;
  expired: boolean;
}

export interface AdminBookingDetailsResponse {
  booking: BookingResponse;
  customer: User;
  documents: DocumentDto[];
}

export type BookingResponse = Booking; // Aliasing existing Booking as BookingResponse for alignment
