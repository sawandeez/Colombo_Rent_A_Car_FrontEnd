export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SPECIAL_ADMIN';

export interface VehicleType {
  id: string;
  name: string;
}

export interface VehicleSummary {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  rentalPricePerDay: number;
  thumbnailUrl?: string;
  isAvailable: boolean;
}

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
  vehicleTypeId: string;
}

export interface AuthResponse {
  token: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
}
