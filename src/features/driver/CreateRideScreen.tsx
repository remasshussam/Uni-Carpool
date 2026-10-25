import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { showDialog } from '@/components/AppDialog';
import { AppInput } from '@/components/AppInput';
import { DateTimeField } from '@/features/driver/components/DateTimeField';
import { ScreenHeader } from '@/features/driver/components/ScreenHeader';
import { SeatCounter } from '@/features/driver/components/SeatCounter';
import { createRide } from '@/features/driver/driverApi';
import { hasFormErrors, parseFare, validateRideForm } from '@/features/driver/rideValidation';
import type { RideFormErrors, RideFormValues } from '@/features/driver/types';
import { navigateToMyRides } from '@/navigation/AppNavigator';
import { isSupabaseConfigured } from '@/lib/supabase';
import { PreviewModeCard } from '@/features/driver/components/PreviewModeCard';

function defaultDeparture(): Date {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(8, 0, 0, 0);
  return next;
}

export default function CreateRideScreen() {
  const [values, setValues] = useState<RideFormValues>({
    pickupPoint: '',
    dropoffPoint: '',
    departure: defaultDeparture(),
    totalSeats: 3,
    fare: '',
  });
  const [errors, setErrors] = useState<RideFormErrors>({});
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof RideFormValues>(key: K, value: RideFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const publish = async () => {
    if (saving) {
      return;
    }

    const nextErrors = validateRideForm(values);
    setErrors(nextErrors);
    if (hasFormErrors(nextErrors)) {
      return;
    }

    setSaving(true);
    const result = await createRide({
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
        title: 'Could not publish ride',
        message: result.error,
        primaryLabel: 'OK',
      });
      return;
    }

    showDialog({
      tone: 'success',
      title: 'Ride published',
      message: 'Your ride is now available for riders.',
      primaryLabel: 'View My Rides',
      dismissible: false,
      onPrimary: () => navigateToMyRides('upcoming'),
    });
  };

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <ScreenHeader title="Create Ride" onBack={() => router.back()} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-5 py-5 pb-10">
          {!isSupabaseConfigured ? (
            <View className="mb-4">
              <PreviewModeCard compact />
            </View>
          ) : null}

          <Text className="mb-4 text-sm text-[#6B7280]">
            Fill in the trip details. Pickup, destination, and departure must all be set before publishing.
          </Text>

          <View className="gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <AppInput
              label="Pickup Point"
              value={values.pickupPoint}
              onChangeText={(text) => update('pickupPoint', text)}
              placeholder="Nasr City"
              error={errors.pickupPoint}
            />
            <AppInput
              label="Drop-off Point"
              value={values.dropoffPoint}
              onChangeText={(text) => update('dropoffPoint', text)}
              placeholder="GIU University"
              error={errors.dropoffPoint}
            />
            <DateTimeField
              label="Departure Date"
              mode="date"
              value={values.departure}
              onChange={(next) => update('departure', next)}
              error={errors.departure}
            />
            <DateTimeField
              label="Departure Time"
              mode="time"
              value={values.departure}
              onChange={(next) => update('departure', next)}
              error={errors.departure}
            />
            <SeatCounter
              label="Available Seats"
              value={values.totalSeats}
              onChange={(next) => update('totalSeats', next)}
              error={errors.totalSeats}
            />
            <AppInput
              label="Fare per Seat (EGP)"
              value={values.fare}
              onChangeText={(text) => update('fare', text)}
              placeholder="50"
              keyboardType="decimal-pad"
              error={errors.fare}
            />
          </View>

          <View className="mt-6">
            <AppButton title="Publish Ride" onPress={() => void publish()} loading={saving} disabled={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
