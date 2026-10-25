import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { RideCard } from '@/components/RideCard';
import { DriverStatsCard } from '@/features/driver/components/DriverStatsCard';
import { EmptyState } from '@/features/driver/components/EmptyState';
import { PreviewModeCard } from '@/features/driver/components/PreviewModeCard';
import { RideStatusBadge } from '@/features/driver/components/RideStatusBadge';
import { getDriverDashboardStats, getDriverProfile } from '@/features/driver/driverApi';
import type { DriverDashboardStats } from '@/features/driver/types';
import { firstNameFrom } from '@/lib/formatters';
import type { Profile } from '@/lib/database.types';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  navigateToCreateRide,
  navigateToEditCancelRide,
  navigateToManageRequests,
  navigateToMyRides,
  navigateToNotifications,
} from '@/navigation/AppNavigator';

export default function DriverHomeScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DriverDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const [profileResult, statsResult] = await Promise.all([
      getDriverProfile(),
      getDriverDashboardStats(),
    ]);

    if (!profileResult.ok) {
      setError(profileResult.error);
      setProfile(null);
      setStats(null);
    } else if (!statsResult.ok) {
      setError(statsResult.error);
      setProfile(profileResult.data);
      setStats(null);
    } else {
      setError(null);
      setProfile(profileResult.data);
      setStats(statsResult.data);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const name = firstNameFrom(profile?.full_name);

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <View className="bg-[#14213D] px-5 pb-6" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#00A878]">
              <Ionicons name="car" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-lg font-bold text-white">Uni Carpool</Text>
              <Text className="text-xs text-white/70">Driver dashboard</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            onPress={navigateToNotifications}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00A878" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8 pt-5"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#00A878" />
          }>
          <Text className="text-2xl font-bold text-[#14213D]">Hello, {name}!</Text>
          <Text className="mt-1 text-base text-[#6B7280]">Ready to offer a ride?</Text>

          {!isSupabaseConfigured ? (
            <View className="mt-4">
              <PreviewModeCard />
            </View>
          ) : error ? (
            <View className="mt-4 rounded-xl border border-[#EF4444]/20 bg-red-50 p-4">
              <Text className="text-sm text-[#EF4444]">{error}</Text>
              <View className="mt-3">
                <AppButton title="Try again" variant="ghost" onPress={() => void load()} />
              </View>
            </View>
          ) : null}

          <View className="mt-5">
            <AppButton title="+ Create New Ride" onPress={navigateToCreateRide} />
          </View>

          <View className="mt-5 flex-row gap-3">
            <DriverStatsCard
              label="Active Rides"
              value={stats?.activeRides ?? 0}
              icon="car-outline"
              onPress={() => navigateToMyRides('upcoming')}
            />
            <DriverStatsCard
              label="Pending Requests"
              value={stats?.pendingRequests ?? 0}
              icon="mail-unread-outline"
              onPress={() => navigateToManageRequests()}
            />
          </View>

          <Text className="mb-3 mt-6 text-lg font-bold text-[#14213D]">Upcoming Rides</Text>

          {stats && stats.upcomingRides.length === 0 ? (
            <EmptyState
              title="No active rides right now."
              message="Publish a ride so students can request a seat."
              actionLabel="Create Your First Ride"
              onAction={navigateToCreateRide}
            />
          ) : (
            <View className="gap-3">
              {stats?.upcomingRides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  badge={<RideStatusBadge ride={ride} />}
                  actions={
                    <AppButton
                      title="Manage Ride"
                      variant="secondary"
                      onPress={() => navigateToEditCancelRide(ride.id)}
                    />
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
