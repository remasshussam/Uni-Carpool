import type { RideFormErrors, RideFormValues } from '@/features/driver/types';

export const MIN_SEATS = 1;
export const MAX_SEATS = 6;

export function parseFare(raw: string): number {
  return Number(raw.trim().replace(',', '.'));
}

export function validateRideForm(values: RideFormValues, now = new Date()): RideFormErrors {
  const errors: RideFormErrors = {};
  const pickup = values.pickupPoint.trim();
  const dropoff = values.dropoffPoint.trim();

  if (!pickup) {
    errors.pickupPoint = 'Pickup point is required.';
  }

  if (!dropoff) {
    errors.dropoffPoint = 'Drop-off point is required.';
  }

  if (pickup && dropoff && pickup.toLowerCase() === dropoff.toLowerCase()) {
    errors.dropoffPoint = 'Pickup and destination cannot be identical.';
  }

  if (!(values.departure instanceof Date) || Number.isNaN(values.departure.getTime())) {
    errors.departure = 'Choose a valid departure date and time.';
  } else if (values.departure.getTime() <= now.getTime()) {
    errors.departure = 'Departure date and time must be in the future.';
  }

  if (!Number.isInteger(values.totalSeats) || values.totalSeats < MIN_SEATS || values.totalSeats > MAX_SEATS) {
    errors.totalSeats = `Seats must be an integer from ${MIN_SEATS} to ${MAX_SEATS}.`;
  }

  const fare = parseFare(values.fare);
  if (!Number.isFinite(fare) || fare <= 0) {
    errors.fare = 'Fare must be a positive number in EGP.';
  }

  return errors;
}

export function hasFormErrors(errors: RideFormErrors): boolean {
  return Object.values(errors).some((message) => Boolean(message));
}
