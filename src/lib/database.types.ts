export type RideStatus = 'active' | 'completed' | 'canceled';
export type RideRequestStatus = 'pending' | 'accepted' | 'rejected' | 'canceled';

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  profile_image_url: string | null;
  average_rating: number | null;
  rating_count: number | null;
};

export type Ride = {
  id: string;
  driver_id: string;
  pickup_point: string;
  dropoff_point: string;
  departure_time: string;
  total_seats: number;
  available_seats: number;
  fare: number;
  status: RideStatus;
  created_at: string;
  updated_at: string;
};

export type RideRequest = {
  id: string;
  ride_id: string;
  rider_id: string;
  requested_seats: number;
  status: RideRequestStatus;
  created_at: string;
  updated_at: string;
};

export type RiderSummary = Pick<
  Profile,
  'id' | 'full_name' | 'profile_image_url' | 'average_rating' | 'rating_count'
>;

export type RideRequestWithRider = RideRequest & {
  rider: RiderSummary | null;
};
