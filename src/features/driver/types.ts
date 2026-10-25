import type { Ride, RideRequestWithRider } from '@/lib/database.types';

export type DriverApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export type CreateRideInput = {
  pickup_point: string;
  dropoff_point: string;
  departure_time: string;
  total_seats: number;
  fare: number;
};

export type UpdateRideInput = {
  pickup_point: string;
  dropoff_point: string;
  departure_time: string;
  total_seats: number;
  fare: number;
};

export type DriverDashboardStats = {
  activeRides: number;
  pendingRequests: number;
  upcomingRides: Ride[];
};

export type RideWithBookings = Ride & {
  accepted_seats: number;
};

export type RideFormValues = {
  pickupPoint: string;
  dropoffPoint: string;
  departure: Date;
  totalSeats: number;
  fare: string;
};

export type RideFormErrors = Partial<Record<keyof RideFormValues, string>>;

export type RideListTab = 'upcoming' | 'completed' | 'canceled';

export type PendingRideRequest = RideRequestWithRider;

export type PendingRequestGroup = {
  ride: RideWithBookings;
  requests: RideRequestWithRider[];
};
