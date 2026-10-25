import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { RideCard } from '@/components/RideCard';
import { EmptyState } from '@/features/driver/components/EmptyState';
import { PreviewModeCard } from '@/features/driver/components/PreviewModeCard';
import { RideStatusBadge } from '@/features/driver/components/RideStatusBadge';
import { getDriverRides } from '@/features/driver/driverApi';
import { readParam } from '@/features/driver/navigationParams';
import type { RideListTab } from '@/features/driver/types';
import type { Ride } from '@/lib/database.types';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  navigateToCreateRide,
  navigateToEditCancelRide,
  navigateToManageRequests,
} from '@/navigation/AppNavigator';

const TABS: { id: RideListTab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'canceled', label: 'Canceled' },
];

function parseTab(value: string | undefined): RideListTab | null {
  if (value === 'upcoming' || value === 'completed' || value === 'canceled') {
    return value;
  }
  return null;
}

function matchesTab(ride: Ride, tab: RideListTab): boolean {
  if (tab === 'completed') {
    return ride.status === 'completed';
  }
  if (tab === 'canceled') {
    return ride.status === 'canceled';
  }
  return ride.status === 'active';
}

export default function MyRidesScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string | string[]; focus?: string | string[] }>();
  const requestedTab = parseTab(readParam(params.tab));
  const focusToken = readParam(params.focus);
  const [rides, setRides] = useState<Ride[]>([]);
  const [tab, setTab] = useState<RideListTab>(requestedTab ?? 'upcoming');
  const requestKey = requestedTab ? `${requestedTab}:${focusToken ?? ''}` : null;
  const [appliedRequestKey, setAppliedRequestKey] = useState<string | null>(requestKey);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const result = await getDriverRides();
    if (!result.ok) {
      setError(result.error);
      setRides([]);
    } else {
      setError(null);
      setRides(result.data);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  if (requestKey && requestKey !== appliedRequestKey && requestedTab) {
    setAppliedRequestKey(requestKey);
    setTab(requestedTab);
  }

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visibleRides = useMemo(() => rides.filter((ride) => matchesTab(ride, tab)), [rides, tab]);

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <View className="bg-[#14213D] px-5 pb-5" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-lg font-bold text-white">My Rides</Text>
        <Text className="mt-1 text-xs text-white/70">Only rides you published appear here.</Text>
      </View>

      <View className="flex-row gap-2 px-5 py-4">
        {TABS.map((item) => {
          const selected = item.id === tab;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              className={`flex-1 rounded-full px-3 py-2 ${selected ? 'bg-[#00A878]' : 'bg-white border border-[#E5E7EB]'}`}>
              <Text className={`text-center text-sm font-semibold ${selected ? 'text-white' : 'text-[#6B7280]'}`}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00A878" />
        </View>
      ) : error ? (
        <View className="px-5">
          <EmptyState icon="alert-circle-outline" title="Could not load rides" message={error} actionLabel="Try again" onAction={() => void load()} />
        </View>
      ) : (
        <FlatList
          data={visibleRides}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#00A878" />
          }
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListHeaderComponent={
            !isSupabaseConfigured ? (
              <View className="mb-4">
                <PreviewModeCard compact />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              title={emptyTitle(tab)}
              actionLabel={tab === 'upcoming' ? 'Create Ride' : undefined}
              onAction={tab === 'upcoming' ? navigateToCreateRide : undefined}
            />
          }
          renderItem={({ item }) => (
            <RideCard
              ride={item}
              badge={<RideStatusBadge ride={item} />}
              actions={
                item.status === 'active' ? (
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <AppButton title="View Requests" onPress={() => navigateToManageRequests(item.id)} />
                    </View>
                    <View className="flex-1">
                      <AppButton
                        title="Edit Ride"
                        variant="secondary"
                        onPress={() => navigateToEditCancelRide(item.id)}
                      />
                    </View>
                  </View>
                ) : undefined
              }
            />
          )}
        />
      )}
    </View>
  );
}

function emptyTitle(tab: RideListTab): string {
  if (tab === 'completed') {
    return 'No completed rides yet.';
  }
  if (tab === 'canceled') {
    return 'No canceled rides.';
  }
  return 'No upcoming rides.';
}
