import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { showDialog } from '@/components/AppDialog';
import { EmptyState } from '@/features/driver/components/EmptyState';
import { RequestCard } from '@/features/driver/components/RequestCard';
import { ScreenHeader } from '@/features/driver/components/ScreenHeader';
import {
  acceptRideRequest,
  getDriverPendingRequestGroups,
  getRideById,
  getRideRequests,
  rejectRideRequest,
} from '@/features/driver/driverApi';
import { readParam } from '@/features/driver/navigationParams';
import type { PendingRequestGroup, RideWithBookings } from '@/features/driver/types';
import { formatRideSchedule } from '@/lib/formatters';
import type { RideRequestWithRider } from '@/lib/database.types';

type RequestSection = PendingRequestGroup & {
  data: RideRequestWithRider[];
};

export default function ManageRequestsScreen() {
  const { rideId: rideIdParam } = useLocalSearchParams<{ rideId?: string | string[] }>();
  const rideId = readParam(rideIdParam);
  const [groups, setGroups] = useState<PendingRequestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const lock = useRef(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    if (rideId) {
      const [rideResult, requestResult] = await Promise.all([getRideById(rideId), getRideRequests(rideId)]);

      if (!rideResult.ok) {
        setError(rideResult.error);
        setGroups([]);
      } else if (!requestResult.ok) {
        setError(requestResult.error);
        setGroups([{ ride: rideResult.data, requests: [] }]);
      } else {
        setError(null);
        setGroups([{ ride: rideResult.data, requests: requestResult.data }]);
      }
    } else {
      const result = await getDriverPendingRequestGroups();
      if (!result.ok) {
        setError(result.error);
        setGroups([]);
      } else {
        setError(null);
        setGroups(result.data);
      }
    }

    setLoading(false);
    setRefreshing(false);
  }, [rideId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const riderName = (request: RideRequestWithRider) => request.rider?.full_name?.trim() || 'Rider';

  const seatsAfter = (request: RideRequestWithRider) => {
    const group = groups.find((item) => item.ride.id === request.ride_id);
    if (!group) {
      return null;
    }
    return Math.max(0, group.ride.available_seats - request.requested_seats);
  };

  const handleAccept = async (request: RideRequestWithRider) => {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setProcessingId(request.id);
    try {
      const result = await acceptRideRequest(request.id);
      if (!result.ok) {
        showDialog({
          tone: 'error',
          title: 'Could not accept request',
          message: result.error,
          primaryLabel: 'OK',
        });
        return;
      }

      const remaining = seatsAfter(request);
      const seatsLeft =
        remaining === null ? '' : ` ${remaining} seat${remaining === 1 ? '' : 's'} left on this ride.`;
      await load(true);
      showDialog({
        tone: 'success',
        title: 'Request accepted',
        message: `${riderName(request)} was accepted.${seatsLeft}`,
        primaryLabel: 'OK',
      });
    } finally {
      lock.current = false;
      setProcessingId(null);
    }
  };

  const handleReject = async (request: RideRequestWithRider) => {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setProcessingId(request.id);
    try {
      const result = await rejectRideRequest(request.id);
      if (!result.ok) {
        showDialog({
          tone: 'error',
          title: 'Could not reject request',
          message: result.error,
          primaryLabel: 'OK',
        });
        return;
      }

      await load(true);
      showDialog({
        tone: 'info',
        title: 'Request rejected',
        message: `${riderName(request)}'s request was rejected.`,
        primaryLabel: 'OK',
      });
    } finally {
      lock.current = false;
      setProcessingId(null);
    }
  };

  const openRider = (request: RideRequestWithRider) => {
    showDialog({
      tone: 'info',
      title: 'Rider profile',
      message: `${riderName(request)}'s profile is not available yet. This shortcut stays inactive until that screen is added.`,
      primaryLabel: 'OK',
    });
  };

  const sections: RequestSection[] = groups
    .filter((group) => group.requests.length > 0)
    .map((group) => ({
      ...group,
      data: group.requests,
    }));
  const pendingCount = groups.reduce((sum, group) => sum + group.requests.length, 0);
  const singleRide: RideWithBookings | null = rideId ? (groups[0]?.ride ?? null) : null;

  return (
    <View className="flex-1 bg-[#14213D]">
      <StatusBar style="light" />
      <ScreenHeader variant="sheet" title={rideId ? 'Ride Requests' : 'Pending Requests'} onBack={() => router.back()} />

      <View className="flex-1 overflow-hidden rounded-t-[32px] bg-white">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#00A878" />
          </View>
        ) : error ? (
          <View className="px-5 pt-6">
            <EmptyState
              icon="alert-circle-outline"
              title="Could not load requests"
              message={error}
              actionLabel="Try again"
              onAction={() => void load()}
            />
          </View>
        ) : (
          <SectionList<RideRequestWithRider, RequestSection>
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-8 pt-5"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void load(true)}
                tintColor="#00A878"
                colors={['#00A878']}
              />
            }
            ItemSeparatorComponent={() => <View className="h-3.5" />}
            SectionSeparatorComponent={() => <View className="h-3.5" />}
            ListHeaderComponent={
              <View className="mb-1">
                {singleRide ? <RouteSummary ride={singleRide} /> : null}
                <Text className={`${singleRide ? 'mt-5' : ''} text-[17px] font-bold text-[#1F2937]`}>
                  Pending Requests ({pendingCount})
                </Text>
                {!rideId ? (
                  <Text className="mb-3 mt-1 text-sm text-[#6B7280]">
                    Pending requests are grouped by ride.
                  </Text>
                ) : (
                  <View className="h-3.5" />
                )}
              </View>
            }
            renderSectionHeader={({ section }) =>
              rideId ? null : (
                <View className="mb-3.5">
                  <RouteSummary ride={section.ride} />
                </View>
              )
            }
            ListEmptyComponent={<EmptyState icon="people-outline" title="No pending ride requests." />}
            renderItem={({ item }) => (
              <RequestCard
                request={item}
                processing={processingId === item.id}
                onAccept={() => void handleAccept(item)}
                onReject={() => void handleReject(item)}
                onOpenRider={() => openRider(item)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

function RouteSummary({ ride }: { ride: RideWithBookings }) {
  const seatLabel = ride.available_seats === 1 ? 'seat' : 'seats';

  return (
    <View className="rounded-2xl bg-[#F3F4F6] px-4 py-4">
      <Text className="text-base font-bold text-[#1F2937]">
        {ride.pickup_point} → {ride.dropoff_point}
      </Text>
      <Text className="mt-1 text-[13px] text-[#6B7280]">{formatRideSchedule(ride.departure_time)}</Text>
      <Text className="mt-1 text-[13px] text-[#6B7280]">
        {ride.available_seats} {seatLabel} available
      </Text>
    </View>
  );
}
