/**
 * Driver feature data layer.
 *
 * Required Supabase objects (see supabase/migrations/20241022_driver_feature.sql):
 * - tables: profiles, rides, ride_requests, notifications
 * - RPCs: accept_ride_request, reject_ride_request, update_driver_ride, cancel_driver_ride
 *
 * Cloud writes for accept/reject/edit-capacity/cancel are not client-side dual updates.
 * If an RPC is missing, these functions return the database error plus setup instructions.
 * Never ship the service-role key in this app; authorization uses auth.uid() + RLS.
 */
import { getCurrentMockUser } from '@/features/auth/authApi';
import {
  previewAcceptRequest,
  previewCancelRide,
  previewCreateRide,
  previewDashboard,
  previewPendingGroups,
  previewProfile,
  previewRejectRequest,
  previewRequestsForRide,
  previewRideById,
  previewRides,
  previewUpdateRide,
} from '@/features/driver/previewData';
import { supabase, SUPABASE_CONFIG_ERROR, SUPABASE_UNCONFIGURED, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile, Ride, RideRequest, RideRequestStatus, RideRequestWithRider, RiderSummary } from '@/lib/database.types';
import type {
  CreateRideInput,
  DriverApiResult,
  DriverDashboardStats,
  PendingRequestGroup,
  RideWithBookings,
  UpdateRideInput,
} from '@/features/driver/types';

const MISSING_RPC_HINT =
  'Run supabase/migrations/20241022_driver_feature.sql in the Supabase SQL Editor to install the required tables and RPCs.';

function fail(error: string, code?: string): DriverApiResult<never> {
  return { ok: false, error, code };
}

function fromUnknown(error: unknown, fallback: string): DriverApiResult<never> {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message: unknown }).message || fallback);
    const code = 'code' in error ? String((error as { code: unknown }).code) : undefined;
    return fail(withRpcHint(message, code), code);
  }
  return fail(fallback);
}

function withRpcHint(message: string, code?: string): string {
  const missingFn =
    code === 'PGRST202' ||
    code === '42883' ||
    /could not find the function/i.test(message) ||
    /function .* does not exist/i.test(message);

  if (missingFn) {
    return `${message} ${MISSING_RPC_HINT}`;
  }
  return message;
}

function asNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return value;
  }
  return Number(value ?? 0);
}

function mapRide(row: RideRow): Ride {
  return {
    id: row.id,
    driver_id: row.driver_id,
    pickup_point: row.pickup_point,
    dropoff_point: row.dropoff_point,
    departure_time: row.departure_time,
    total_seats: asNumber(row.total_seats),
    available_seats: asNumber(row.available_seats),
    fare: asNumber(row.fare),
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

type RideRow = Omit<Ride, 'total_seats' | 'available_seats' | 'fare'> & {
  total_seats: number | string;
  available_seats: number | string;
  fare: number | string;
};

type ProfileRow = Omit<Profile, 'average_rating' | 'rating_count'> & {
  average_rating: number | string | null;
  rating_count: number | string | null;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    ...row,
    average_rating: row.average_rating === null ? null : asNumber(row.average_rating),
    rating_count: row.rating_count === null ? null : asNumber(row.rating_count),
  };
}

function isUpcomingActive(ride: Ride, now = new Date()): boolean {
  return ride.status === 'active' && new Date(ride.departure_time).getTime() > now.getTime();
}

async function getAuthenticatedUserId(): Promise<DriverApiResult<string>> {
  if (!isSupabaseConfigured) {
    return fail(SUPABASE_CONFIG_ERROR, SUPABASE_UNCONFIGURED);
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return fail(error.message, error.name);
  }
  if (!data.user) {
    return fail('You must be signed in to manage rides.');
  }
  return { ok: true, data: data.user.id };
}

export async function getDriverProfile(): Promise<DriverApiResult<Profile>> {
  if (!isSupabaseConfigured) {
    const session = getCurrentMockUser();
    const profile = previewProfile();
    if (!session) {
      return { ok: true, data: profile };
    }
    return {
      ok: true,
      data: {
        ...profile,
        full_name: session.fullName,
        email: session.email,
        phone_number: session.phoneNumber,
      },
    };
  }

  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return auth;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone_number, profile_image_url, average_rating, rating_count')
    .eq('id', auth.data)
    .maybeSingle();

  if (error) {
    return fail(error.message, error.code);
  }

  if (!data) {
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email ?? null;
    const metadataName =
      typeof userData.user?.user_metadata?.full_name === 'string'
        ? userData.user.user_metadata.full_name
        : email?.split('@')[0] ?? 'Driver';

    return {
      ok: true,
      data: {
        id: auth.data,
        full_name: metadataName,
        email,
        phone_number: null,
        profile_image_url: null,
        average_rating: null,
        rating_count: 0,
      },
    };
  }

  return { ok: true, data: mapProfile(data as ProfileRow) };
}

export async function getDriverRides(): Promise<DriverApiResult<Ride[]>> {
  if (!isSupabaseConfigured) {
    return { ok: true, data: previewRides() };
  }

  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return auth;
  }

  const { data, error } = await supabase
    .from('rides')
    .select(
      'id, driver_id, pickup_point, dropoff_point, departure_time, total_seats, available_seats, fare, status, created_at, updated_at',
    )
    .eq('driver_id', auth.data)
    .order('departure_time', { ascending: true });

  if (error) {
    return fail(error.message, error.code);
  }

  return { ok: true, data: ((data ?? []) as RideRow[]).map(mapRide) };
}

export async function getDriverDashboardStats(): Promise<DriverApiResult<DriverDashboardStats>> {
  if (!isSupabaseConfigured) {
    return { ok: true, data: previewDashboard() };
  }

  const ridesResult = await getDriverRides();
  if (!ridesResult.ok) {
    return ridesResult;
  }

  const upcomingRides = ridesResult.data.filter((ride) => isUpcomingActive(ride));
  const rideIds = ridesResult.data.map((ride) => ride.id);

  let pendingRequests = 0;
  if (rideIds.length > 0) {
    const { count, error } = await supabase
      .from('ride_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .in('ride_id', rideIds);

    if (error) {
      return fail(error.message, error.code);
    }
    pendingRequests = count ?? 0;
  }

  return {
    ok: true,
    data: {
      activeRides: upcomingRides.length,
      pendingRequests,
      upcomingRides,
    },
  };
}

export async function createRide(rideData: CreateRideInput): Promise<DriverApiResult<Ride>> {
  if (!isSupabaseConfigured) {
    const driverId = getCurrentMockUser()?.id ?? 'preview-driver';
    return previewCreateRide(rideData, driverId);
  }

  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return auth;
  }

  const { data, error } = await supabase
    .from('rides')
    .insert({
      driver_id: auth.data,
      pickup_point: rideData.pickup_point.trim(),
      dropoff_point: rideData.dropoff_point.trim(),
      departure_time: rideData.departure_time,
      total_seats: rideData.total_seats,
      available_seats: rideData.total_seats,
      fare: rideData.fare,
      status: 'active',
    })
    .select(
      'id, driver_id, pickup_point, dropoff_point, departure_time, total_seats, available_seats, fare, status, created_at, updated_at',
    )
    .single();

  if (error) {
    return fail(error.message, error.code);
  }

  return { ok: true, data: mapRide(data as RideRow) };
}

export async function getRideById(rideId: string): Promise<DriverApiResult<RideWithBookings>> {
  if (!isSupabaseConfigured) {
    const ride = previewRideById(rideId);
    return ride ? { ok: true, data: ride } : fail('Ride not found.');
  }

  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return auth;
  }

  const { data, error } = await supabase
    .from('rides')
    .select(
      'id, driver_id, pickup_point, dropoff_point, departure_time, total_seats, available_seats, fare, status, created_at, updated_at',
    )
    .eq('id', rideId)
    .maybeSingle();

  if (error) {
    return fail(error.message, error.code);
  }
  if (!data) {
    return fail('Ride not found.');
  }

  const ride = mapRide(data as RideRow);
  if (ride.driver_id !== auth.data) {
    return fail('You can only manage rides that you created.', 'not_owner');
  }

  const { data: acceptedRows, error: acceptedError } = await supabase
    .from('ride_requests')
    .select('requested_seats')
    .eq('ride_id', rideId)
    .eq('status', 'accepted');

  if (acceptedError) {
    return fail(acceptedError.message, acceptedError.code);
  }

  const acceptedSeats = (acceptedRows ?? []).reduce((sum, row) => {
    return sum + asNumber((row as { requested_seats: number | string }).requested_seats);
  }, 0);

  return {
    ok: true,
    data: {
      ...ride,
      accepted_seats: acceptedSeats,
    },
  };
}

export async function updateRide(
  rideId: string,
  updates: UpdateRideInput,
): Promise<DriverApiResult<Ride>> {
  if (!isSupabaseConfigured) {
    return previewUpdateRide(rideId, updates);
  }

  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return auth;
  }

  const { data, error } = await supabase.rpc('update_driver_ride', {
    p_ride_id: rideId,
    p_pickup_point: updates.pickup_point,
    p_dropoff_point: updates.dropoff_point,
    p_departure_time: updates.departure_time,
    p_total_seats: updates.total_seats,
    p_fare: updates.fare,
  });

  if (error) {
    return fromUnknown(error, 'Could not update the ride.');
  }

  return { ok: true, data: mapRide(data as RideRow) };
}

export async function cancelRide(rideId: string): Promise<DriverApiResult<Ride>> {
  if (!isSupabaseConfigured) {
    return previewCancelRide(rideId);
  }

  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return auth;
  }

  const { data, error } = await supabase.rpc('cancel_driver_ride', {
    p_ride_id: rideId,
  });

  if (error) {
    return fromUnknown(error, 'Could not cancel the ride.');
  }

  return { ok: true, data: mapRide(data as RideRow) };
}

export async function getDriverPendingRequestGroups(): Promise<DriverApiResult<PendingRequestGroup[]>> {
  if (!isSupabaseConfigured) {
    return { ok: true, data: previewPendingGroups() };
  }

  const ridesResult = await getDriverRides();
  if (!ridesResult.ok) {
    return ridesResult;
  }

  const groups: PendingRequestGroup[] = [];
  for (const ride of ridesResult.data) {
    if (ride.status !== 'active') {
      continue;
    }

    const [detail, requestsResult] = await Promise.all([getRideById(ride.id), getRideRequests(ride.id)]);
    if (!detail.ok) {
      return detail;
    }
    if (!requestsResult.ok) {
      return requestsResult;
    }
    if (requestsResult.data.length === 0) {
      continue;
    }

    groups.push({ ride: detail.data, requests: requestsResult.data });
  }

  return { ok: true, data: groups };
}

export async function getRideRequests(rideId: string): Promise<DriverApiResult<RideRequestWithRider[]>> {
  if (!isSupabaseConfigured) {
    if (!previewRideById(rideId)) {
      return fail('Ride not found.');
    }
    return { ok: true, data: previewRequestsForRide(rideId) };
  }

  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return auth;
  }

  const { data: ride, error: rideError } = await supabase
    .from('rides')
    .select('id, driver_id')
    .eq('id', rideId)
    .maybeSingle();

  if (rideError) {
    return fail(rideError.message, rideError.code);
  }
  if (!ride) {
    return fail('Ride not found.');
  }
  if ((ride as { driver_id: string }).driver_id !== auth.data) {
    return fail('You can only manage requests for rides that you created.', 'not_owner');
  }

  const { data, error } = await supabase
    .from('ride_requests')
    .select('id, ride_id, rider_id, requested_seats, status, created_at, updated_at')
    .eq('ride_id', rideId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    return fail(error.message, error.code);
  }

  const requests = (data ?? []) as RideRequest[];
  if (requests.length === 0) {
    return { ok: true, data: [] };
  }

  const riderIds = [...new Set(requests.map((request) => request.rider_id))];
  const { data: riders, error: riderError } = await supabase
    .from('profiles')
    .select('id, full_name, profile_image_url, average_rating, rating_count')
    .in('id', riderIds);

  if (riderError) {
    return fail(riderError.message, riderError.code);
  }

  const ridersById = new Map<string, RiderSummary>(
    ((riders ?? []) as RiderSummary[]).map((rider) => [
      rider.id,
      {
        ...rider,
        average_rating: rider.average_rating === null ? null : asNumber(rider.average_rating),
        rating_count: rider.rating_count === null ? null : asNumber(rider.rating_count),
      },
    ]),
  );

  return {
    ok: true,
    data: requests.map((request) => ({
      ...request,
      requested_seats: asNumber(request.requested_seats),
      rider: ridersById.get(request.rider_id) ?? null,
    })),
  };
}

async function mutateRideRequest(
  requestId: string,
  fnName: 'accept_ride_request' | 'reject_ride_request',
): Promise<DriverApiResult<RideRequest>> {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return auth;
  }

  const { data, error } = await supabase.rpc(fnName, {
    p_request_id: requestId,
  });

  if (error) {
    return fromUnknown(error, `Could not ${fnName === 'accept_ride_request' ? 'accept' : 'reject'} the request.`);
  }

  const row = data as RideRequest;
  return {
    ok: true,
    data: {
      ...row,
      requested_seats: asNumber(row.requested_seats),
      status: row.status as RideRequestStatus,
    },
  };
}

export async function acceptRideRequest(requestId: string): Promise<DriverApiResult<RideRequest>> {
  if (!isSupabaseConfigured) {
    return previewAcceptRequest(requestId);
  }
  return mutateRideRequest(requestId, 'accept_ride_request');
}

export async function rejectRideRequest(requestId: string): Promise<DriverApiResult<RideRequest>> {
  if (!isSupabaseConfigured) {
    return previewRejectRequest(requestId);
  }
  return mutateRideRequest(requestId, 'reject_ride_request');
}

export { isUpcomingActive };
