/**
 * Single Phase 1 mock ride store shared by every Driver screen.
 *
 * Dashboard counts, My Rides, requests, create, edit, and cancel all read this
 * memory. It is not a second copy of the rides. Restarting the app restores the
 * seeded demo trips and drops rides created during the session.
 *
 * Phase 2 replaces these helpers inside driverApi with Supabase. Do not add
 * another ride store beside this one.
 */
import { getCurrentMockRole, getCurrentMockUser } from '@/features/auth/authApi';
import type { Profile, Ride, RideRequest, RideRequestWithRider, RiderSummary } from '@/lib/database.types';
import type {
  CreateRideInput,
  DriverApiResult,
  DriverDashboardStats,
  PendingRequestGroup,
  RideWithBookings,
  UpdateRideInput,
} from '@/features/driver/types';

const DRIVER_ID = 'preview-driver';

type PreviewStore = {
  rides: Ride[];
  requests: RideRequestWithRider[];
};

let memory: PreviewStore | null = null;

function atHour(dayOffset: number, hour: number, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function ride(partial: Omit<Ride, 'driver_id' | 'created_at' | 'updated_at'>): Ride {
  const createdAt = atHour(-3, 9);
  return {
    ...partial,
    driver_id: DRIVER_ID,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function rider(
  id: string,
  fullName: string,
  averageRating: number,
  ratingCount: number,
): RiderSummary {
  return {
    id,
    full_name: fullName,
    profile_image_url: null,
    average_rating: averageRating,
    rating_count: ratingCount,
  };
}

function request(
  partial: Omit<RideRequestWithRider, 'created_at' | 'updated_at'> & { created_at?: string },
): RideRequestWithRider {
  const createdAt = partial.created_at ?? atHour(0, 8);
  return {
    ...partial,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function fail(error: string): DriverApiResult<never> {
  return { ok: false, error };
}

function seed(): PreviewStore {
  const sara = rider('preview-rider-sara', 'Sara Mohamed', 4.9, 18);
  const omar = rider('preview-rider-omar', 'Omar Khaled', 4.7, 26);
  const nour = rider('preview-rider-nour', 'Nour Adel', 4.8, 14);
  const youssef = rider('preview-rider-youssef', 'Youssef Ali', 4.5, 9);
  const laila = rider('preview-rider-laila', 'Laila Hassan', 4.6, 21);
  const karim = rider('preview-rider-karim', 'Karim Mostafa', 4.4, 11);
  const hana = rider('preview-rider-hana', 'Hana Mostafa', 4.8, 19);
  const tarek = rider('preview-rider-tarek', 'Tarek Hassan', 4.2, 8);
  const mona = rider('preview-rider-mona', 'Mona Samir', 4.9, 15);
  const farah = rider('preview-rider-farah', 'Farah Nabil', 4.3, 6);
  const rana = rider('preview-rider-rana', 'Rana Adel', 5, 4);
  const adel = rider('preview-rider-adel', 'Adel Fathy', 4.1, 5);

  return {
    rides: [
      ride({
        id: 'preview-ride-nasr',
        pickup_point: 'Nasr City',
        dropoff_point: 'GIU University',
        departure_time: atHour(1, 8, 0),
        total_seats: 4,
        available_seats: 3,
        fare: 35,
        status: 'active',
      }),
      ride({
        id: 'preview-ride-heliopolis',
        pickup_point: 'Heliopolis',
        dropoff_point: 'GIU University',
        departure_time: atHour(2, 7, 30),
        total_seats: 3,
        available_seats: 3,
        fare: 40,
        status: 'active',
      }),
      ride({
        id: 'preview-ride-maadi',
        pickup_point: 'Maadi',
        dropoff_point: 'GIU University',
        departure_time: atHour(3, 16, 15),
        total_seats: 3,
        available_seats: 1,
        fare: 45,
        status: 'active',
      }),
      ride({
        id: 'preview-ride-done',
        pickup_point: 'Faculty of Commerce',
        dropoff_point: 'Nasr City',
        departure_time: atHour(-3, 15, 0),
        total_seats: 3,
        available_seats: 1,
        fare: 25,
        status: 'completed',
      }),
      ride({
        id: 'preview-ride-canceled',
        pickup_point: 'Sports Complex',
        dropoff_point: 'GIU University',
        departure_time: atHour(4, 11, 0),
        total_seats: 2,
        available_seats: 2,
        fare: 20,
        status: 'canceled',
      }),
    ],
    requests: [
      request({
        id: 'preview-request-sara',
        ride_id: 'preview-ride-nasr',
        rider_id: sara.id,
        requested_seats: 1,
        status: 'pending',
        rider: sara,
        created_at: atHour(0, 7, 15),
      }),
      request({
        id: 'preview-request-omar',
        ride_id: 'preview-ride-nasr',
        rider_id: omar.id,
        requested_seats: 1,
        status: 'pending',
        rider: omar,
        created_at: atHour(0, 7, 40),
      }),
      request({
        id: 'preview-request-nour',
        ride_id: 'preview-ride-nasr',
        rider_id: nour.id,
        requested_seats: 1,
        status: 'accepted',
        rider: nour,
        created_at: atHour(-1, 18, 0),
      }),
      request({
        id: 'preview-request-youssef',
        ride_id: 'preview-ride-nasr',
        rider_id: youssef.id,
        requested_seats: 1,
        status: 'rejected',
        rider: youssef,
        created_at: atHour(-1, 12, 0),
      }),
      request({
        id: 'preview-request-laila',
        ride_id: 'preview-ride-heliopolis',
        rider_id: laila.id,
        requested_seats: 1,
        status: 'pending',
        rider: laila,
        created_at: atHour(0, 8, 5),
      }),
      request({
        id: 'preview-request-karim',
        ride_id: 'preview-ride-heliopolis',
        rider_id: karim.id,
        requested_seats: 1,
        status: 'pending',
        rider: karim,
        created_at: atHour(0, 8, 20),
      }),
      request({
        id: 'preview-request-hana',
        ride_id: 'preview-ride-maadi',
        rider_id: hana.id,
        requested_seats: 1,
        status: 'accepted',
        rider: hana,
        created_at: atHour(-1, 9, 0),
      }),
      request({
        id: 'preview-request-tarek',
        ride_id: 'preview-ride-maadi',
        rider_id: tarek.id,
        requested_seats: 1,
        status: 'accepted',
        rider: tarek,
        created_at: atHour(-1, 9, 30),
      }),
      request({
        id: 'preview-request-mona',
        ride_id: 'preview-ride-maadi',
        rider_id: mona.id,
        requested_seats: 2,
        status: 'pending',
        rider: mona,
        created_at: atHour(0, 9, 0),
      }),
      request({
        id: 'preview-request-farah',
        ride_id: 'preview-ride-maadi',
        rider_id: farah.id,
        requested_seats: 1,
        status: 'pending',
        rider: farah,
        created_at: atHour(0, 9, 25),
      }),
      request({
        id: 'preview-request-rana',
        ride_id: 'preview-ride-done',
        rider_id: rana.id,
        requested_seats: 2,
        status: 'accepted',
        rider: rana,
        created_at: atHour(-4, 10, 0),
      }),
      request({
        id: 'preview-request-adel',
        ride_id: 'preview-ride-canceled',
        rider_id: adel.id,
        requested_seats: 1,
        status: 'canceled',
        rider: adel,
        created_at: atHour(-1, 11, 0),
      }),
    ],
  };
}

function ensureStore(): PreviewStore {
  if (!memory) {
    memory = seed();
  }
  return memory;
}

/** Demo rides belong to whoever is signed in as the driver for this session. */
function ready(): PreviewStore {
  const store = ensureStore();
  const user = getCurrentMockUser();
  if (user && getCurrentMockRole() === 'driver') {
    for (const item of store.rides) {
      item.driver_id = user.id;
    }
  }
  return store;
}

function copyRequest(requestItem: RideRequestWithRider): RideRequestWithRider {
  return {
    ...requestItem,
    rider: requestItem.rider ? { ...requestItem.rider } : null,
  };
}

function byDeparture(a: Ride, b: Ride): number {
  return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
}

function acceptedSeatsFor(store: PreviewStore, rideItem: Ride): number {
  const fromRequests = store.requests
    .filter((item) => item.ride_id === rideItem.id && item.status === 'accepted')
    .reduce((sum, item) => sum + item.requested_seats, 0);

  if (fromRequests > 0) {
    return fromRequests;
  }

  if (rideItem.status === 'completed') {
    return Math.max(0, rideItem.total_seats - rideItem.available_seats);
  }

  return 0;
}

function isPast(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

function toPublicRequest(item: RideRequestWithRider): RideRequest {
  return {
    id: item.id,
    ride_id: item.ride_id,
    rider_id: item.rider_id,
    requested_seats: item.requested_seats,
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export function previewProfile(): Profile {
  return {
    id: DRIVER_ID,
    full_name: 'Driver',
    email: null,
    phone_number: null,
    profile_image_url: null,
    average_rating: null,
    rating_count: 0,
  };
}

export function previewRides(): Ride[] {
  return ready()
    .rides.map((item) => ({ ...item }))
    .sort(byDeparture);
}

export function previewDashboard(): DriverDashboardStats {
  const store = ready();
  const upcomingRides = store.rides
    .filter((item) => item.status === 'active')
    .map((item) => ({ ...item }))
    .sort(byDeparture);
  const pendingRequests = store.requests.filter((item) => item.status === 'pending').length;

  return {
    activeRides: upcomingRides.length,
    pendingRequests,
    upcomingRides,
  };
}

export function previewRideById(rideId: string): RideWithBookings | null {
  const store = ready();
  const found = store.rides.find((item) => item.id === rideId);
  if (!found) {
    return null;
  }
  return { ...found, accepted_seats: acceptedSeatsFor(store, found) };
}

export function previewRequestsForRide(rideId: string): RideRequestWithRider[] {
  return ready()
    .requests.filter((item) => item.ride_id === rideId && item.status === 'pending')
    .map(copyRequest);
}

export function previewPendingGroups(): PendingRequestGroup[] {
  const store = ready();
  return store.rides
    .filter((item) => item.status === 'active')
    .sort(byDeparture)
    .map((item) => ({
      ride: { ...item, accepted_seats: acceptedSeatsFor(store, item) },
      requests: store.requests
        .filter((entry) => entry.ride_id === item.id && entry.status === 'pending')
        .map(copyRequest),
    }))
    .filter((group) => group.requests.length > 0);
}

export function previewCreateRide(input: CreateRideInput, driverId: string): DriverApiResult<Ride> {
  const store = ready();
  const now = new Date().toISOString();
  const created: Ride = {
    id: `preview-ride-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    driver_id: driverId,
    pickup_point: input.pickup_point.trim(),
    dropoff_point: input.dropoff_point.trim(),
    departure_time: input.departure_time,
    total_seats: input.total_seats,
    available_seats: input.total_seats,
    fare: input.fare,
    status: 'active',
    created_at: now,
    updated_at: now,
  };
  store.rides.push(created);
  return { ok: true, data: { ...created } };
}

export function previewAcceptRequest(requestId: string): DriverApiResult<RideRequest> {
  const store = ready();
  const found = store.requests.find((item) => item.id === requestId);
  if (!found) {
    return fail('Request not found.');
  }
  if (found.status !== 'pending') {
    return fail('This request is no longer pending.');
  }

  const rideItem = store.rides.find((item) => item.id === found.ride_id);
  if (!rideItem) {
    return fail('Ride not found.');
  }
  if (rideItem.status !== 'active') {
    return fail('This ride is not accepting requests.');
  }
  if (rideItem.available_seats < found.requested_seats) {
    return fail('Not enough available seats for this request.');
  }

  const now = new Date().toISOString();
  found.status = 'accepted';
  found.updated_at = now;
  rideItem.available_seats -= found.requested_seats;
  rideItem.updated_at = now;

  return { ok: true, data: toPublicRequest(found) };
}

export function previewRejectRequest(requestId: string): DriverApiResult<RideRequest> {
  const store = ready();
  const found = store.requests.find((item) => item.id === requestId);
  if (!found) {
    return fail('Request not found.');
  }
  if (found.status !== 'pending') {
    return fail('This request is no longer pending.');
  }

  found.status = 'rejected';
  found.updated_at = new Date().toISOString();

  return { ok: true, data: toPublicRequest(found) };
}

export function previewUpdateRide(rideId: string, updates: UpdateRideInput): DriverApiResult<Ride> {
  const store = ready();
  const rideItem = store.rides.find((item) => item.id === rideId);
  if (!rideItem) {
    return fail('Ride not found.');
  }
  if (rideItem.status !== 'active' || isPast(rideItem.departure_time)) {
    return fail('Completed, canceled, and past rides cannot be edited.');
  }

  const accepted = acceptedSeatsFor(store, rideItem);
  if (updates.total_seats < accepted) {
    return fail(`Capacity cannot be below the ${accepted} already accepted seat(s).`);
  }

  rideItem.pickup_point = updates.pickup_point;
  rideItem.dropoff_point = updates.dropoff_point;
  rideItem.departure_time = updates.departure_time;
  rideItem.total_seats = updates.total_seats;
  rideItem.available_seats = updates.total_seats - accepted;
  rideItem.fare = updates.fare;
  rideItem.updated_at = new Date().toISOString();

  return { ok: true, data: { ...rideItem } };
}

export function previewCancelRide(rideId: string): DriverApiResult<Ride> {
  const store = ready();
  const rideItem = store.rides.find((item) => item.id === rideId);
  if (!rideItem) {
    return fail('Ride not found.');
  }
  if (rideItem.status === 'completed') {
    return fail('Completed rides cannot be canceled.');
  }
  if (rideItem.status === 'canceled') {
    return fail('This ride is already canceled.');
  }
  if (rideItem.status !== 'active') {
    return fail('Only active rides can be canceled.');
  }

  const now = new Date().toISOString();
  rideItem.status = 'canceled';
  rideItem.updated_at = now;

  for (const item of store.requests) {
    if (item.ride_id === rideItem.id && (item.status === 'pending' || item.status === 'accepted')) {
      item.status = 'canceled';
      item.updated_at = now;
    }
  }

  return { ok: true, data: { ...rideItem } };
}
