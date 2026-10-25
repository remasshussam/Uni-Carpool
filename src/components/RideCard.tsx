import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import type { Ride } from '@/lib/database.types';
import { formatFare, formatRideDate, formatRideTime } from '@/lib/formatters';

type RideCardProps = {
  ride: Ride;
  badge?: ReactNode;
  actions?: ReactNode;
};

export function RideCard({ ride, badge, actions }: RideCardProps) {
  return (
    <View
      className="rounded-2xl border border-[#E5E7EB] bg-white p-4"
      style={{ elevation: 2, shadowColor: '#14213D', shadowOpacity: 0.06, shadowRadius: 8 }}>
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <Ionicons name="location" size={16} color="#00A878" />
            <Text className="flex-1 text-base font-semibold text-[#1F2937]">{ride.pickup_point}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="flag" size={16} color="#14213D" />
            <Text className="flex-1 text-base font-semibold text-[#1F2937]">{ride.dropoff_point}</Text>
          </View>
        </View>
        {badge}
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-2">
        <Meta icon="calendar-outline" label={formatRideDate(ride.departure_time)} />
        <Meta icon="time-outline" label={formatRideTime(ride.departure_time)} />
        <Meta icon="people-outline" label={`${ride.available_seats}/${ride.total_seats} seats`} />
        <Meta icon="cash-outline" label={formatFare(ride.fare)} />
      </View>

      {actions ? <View className="mt-4 gap-2">{actions}</View> : null}
    </View>
  );
}

function Meta({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Ionicons name={icon} size={14} color="#6B7280" />
      <Text className="text-sm text-[#6B7280]">{label}</Text>
    </View>
  );
}
