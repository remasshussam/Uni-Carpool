import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { showDialog } from '@/components/AppDialog';
import { AppInput } from '@/components/AppInput';
import { DateTimeField } from '@/features/driver/components/DateTimeField';
import { EmptyState } from '@/features/driver/components/EmptyState';
import { ScreenHeader } from '@/features/driver/components/ScreenHeader';
import { SeatCounter } from '@/features/driver/components/SeatCounter';
import { cancelRide, getRideById, updateRide } from '@/features/driver/driverApi';
import { readParam } from '@/features/driver/navigationParams';
import { MAX_SEATS, hasFormErrors, parseFare, validateRideForm } from '@/features/driver/rideValidation';
import type { RideFormErrors, RideFormValues, RideWithBookings } from '@/features/driver/types';
import { navigateToMyRides } from '@/navigation/AppNavigator';

export default function EditCancelRideScreen() {
  const { rideId: rideIdParam } = useLocalSearchParams<{ rideId?: string | string[] }>();
  const rideId = readParam(rideIdParam);
  const [ride, setRide] = useState<RideWithBookings | null>(null);
  const [values, setValues] = useState<RideFormValues | null>(null);
  const [errors, setErrors] = useState<RideFormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!rideId) {
      setError('Missing ride ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await getRideById(rideId);
    if (!result.ok) {
      setError(result.error);
      setRide(null);
      setValues(null);
      setLoading(false);
      return;
    }

    setError(null);
    setRide(result.data);
    setValues({
      pickupPoint: result.data.pickup_point,
      dropoffPoint: result.data.dropoff_point,
      departure: new Date(result.data.departure_time),
      totalSeats: result.data.total_seats,
      fare: String(result.data.fare),
    });
    setLoading(false);
  }, [rideId]);

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      void load();
    }, [load]),
  );

  const update = <K extends keyof RideFormValues>(key: K, value: RideFormValues[K]) => {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const canEdit =
    ride?.status === 'active' && new Date(ride.departure_time).getTime() > now;

  const save = async () => {
    if (!rideId || !values || saving) {
      return;
    }
    if (!canEdit) {
      showDialog({
        tone: 'warning',
        title: 'Cannot edit ride',
        message: 'Completed, canceled, and past rides cannot be edited.',
        primaryLabel: 'OK',
      });
      return;
    }

    const nextErrors = validateRideForm(values);
    if (ride && values.totalSeats < ride.accepted_seats) {
      nextErrors.totalSeats = `Capacity cannot be below the ${ride.accepted_seats} already accepted seat(s).`;
    }
    setErrors(nextErrors);
    if (hasFormErrors(nextErrors)) {
      return;
    }

    setSaving(true);
    const result = await updateRide(rideId, {
      pickup_point: values.pickupPoint.trim(),
      dropoff_point: values.dropoffPoint.trim(),
      departure_time: values.departure.toISOString(),
      total_seats: values.totalSeats,
      fare: parseFare(values.fare),
    });
    setSaving(false);

    if (!result.ok) {
      showDialog({
        tone: 'error',
        title: 'Could not save changes',
        message: result.error,
        primaryLabel: 'OK',
      });
      return;
    }

    showDialog({
      tone: 'success',
      title: 'Ride updated',
      message: 'Your changes were saved.',
      primaryLabel: 'View My Rides',
      dismissible: false,
      onPrimary: () => navigateToMyRides('upcoming'),
    });
  };

  const confirmCancel = () => {
    if (!rideId || saving) {
      return;
    }
    if (ride && ride.status !== 'active') {
      showDialog({
        tone: 'warning',
        title: 'Cannot cancel ride',
        message: 'Only active rides can be canceled.',
        primaryLabel: 'OK',
      });
      return;
    }

    showDialog({
      tone: 'warning',
      title: 'Cancel this ride?',
      message: 'Are you sure you want to cancel this ride? This action will notify affected riders.',
      primaryLabel: 'Yes, Cancel Ride',
      secondaryLabel: 'No, Keep Ride',
      destructive: true,
      onPrimary: async () => {
        const result = await cancelRide(rideId);
        if (!result.ok) {
          showDialog({
            tone: 'error',
            title: 'Could not cancel ride',
            message: result.error,
            primaryLabel: 'OK',
          });
          return;
        }

        showDialog({
          tone: 'success',
          title: 'Ride canceled',
          message:
            'The ride is now under Canceled. Pending and accepted requests for it were canceled, and seats were left unchanged.',
          primaryLabel: 'View My Rides',
          dismissible: false,
          onPrimary: () => navigateToMyRides('canceled'),
        });
      },
    });
  };

  const accepted = ride?.accepted_seats ?? 0;
  const remaining = values ? Math.max(0, values.totalSeats - accepted) : 0;

  return (
    <View className="flex-1 bg-[#14213D]">
      <StatusBar style="light" />
      <ScreenHeader variant="sheet" title="Edit Ride" onBack={() => router.back()} />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 overflow-hidden rounded-t-[32px] bg-white">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#00A878" />
            </View>
          ) : error || !values || !ride ? (
            <View className="px-5 pt-6">
              <EmptyState
                icon="alert-circle-outline"
                title="Could not load ride"
                message={error ?? 'This ride is unavailable.'}
                actionLabel="Go back"
                onAction={() => router.back()}
              />
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="px-5 pb-10 pt-6">
              {!canEdit ? (
                <View className="mb-5 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-3.5">
                  <Text className="text-sm text-[#92400E]">
                    Completed, canceled, and past rides cannot be edited. The driver cannot be changed.
                  </Text>
                </View>
              ) : null}

              <View className="gap-4" pointerEvents={canEdit ? 'auto' : 'none'}>
                <AppInput
                  appearance="soft"
                  icon="location-outline"
                  label="Pickup Point"
                  value={values.pickupPoint}
                  onChangeText={(text) => update('pickupPoint', text)}
                  error={errors.pickupPoint}
                  editable={canEdit}
                />
                <AppInput
                  appearance="soft"
                  icon="flag-outline"
                  label="Drop-off Point"
                  value={values.dropoffPoint}
                  onChangeText={(text) => update('dropoffPoint', text)}
                  error={errors.dropoffPoint}
                  editable={canEdit}
                />
                <DateTimeField
                  appearance="soft"
                  icon="calendar-outline"
                  label="Departure Date"
                  mode="date"
                  value={values.departure}
                  onChange={(next) => update('departure', next)}
                  error={errors.departure}
                />
                <DateTimeField
                  appearance="soft"
                  icon="time-outline"
                  label="Departure Time"
                  mode="time"
                  value={values.departure}
                  onChange={(next) => update('departure', next)}
                  error={errors.departure}
                />
                <SeatCounter
                  appearance="soft"
                  icon="people-outline"
                  label="Available Seats"
                  value={values.totalSeats}
                  min={Math.max(1, accepted)}
                  max={MAX_SEATS}
                  onChange={(next) => update('totalSeats', next)}
                  error={errors.totalSeats}
                  helper={`${accepted} accepted · ${remaining} still open after save.`}
                />
                <AppInput
                  appearance="soft"
                  icon="cash-outline"
                  label="Fare per Seat (EGP)"
                  value={values.fare}
                  onChangeText={(text) => update('fare', text)}
                  keyboardType="decimal-pad"
                  error={errors.fare}
                  editable={canEdit}
                />
              </View>

              <View className="mt-8 gap-3">
                <AppButton
                  title="Save Changes"
                  onPress={() => void save()}
                  loading={saving}
                  disabled={!canEdit || saving}
                />
                <AppButton
                  title="Cancel Ride"
                  variant="dangerOutline"
                  onPress={confirmCancel}
                  disabled={ride.status !== 'active' || saving}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
