export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SPECIAL_ADMIN';

export interface VehicleType {
  id: string;
  name: string;
}

export interface VehicleSummary {
  name: string;
  thumbnailUrl: string;
}

export interface Vehicle {
  id: string;
  name: string;
  thumbnailUrl: string;
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
