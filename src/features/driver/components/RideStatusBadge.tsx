import { Text, View } from 'react-native';

import { isUpcomingActive } from '@/features/driver/driverApi';
import type { Ride } from '@/lib/database.types';

type RideStatusBadgeProps = {
  ride: Ride;
};

export function RideStatusBadge({ ride }: RideStatusBadgeProps) {
  const style = badgeStyle(ride);

  return (
    <View className={`rounded-full px-3 py-1 ${style.background}`}>
      <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
    </View>
  );
}

function badgeStyle(ride: Ride): { background: string; text: string; label: string } {
  if (ride.status === 'completed') {
    return { background: 'bg-[#E5E7EB]', text: 'text-[#6B7280]', label: 'Completed' };
  }
  if (ride.status === 'canceled') {
    return { background: 'bg-red-100', text: 'text-[#EF4444]', label: 'Canceled' };
  }
  if (isUpcomingActive(ride)) {
    return { background: 'bg-[#DDF7E8]', text: 'text-[#16A34A]', label: 'Upcoming' };
  }
  return { background: 'bg-amber-100', text: 'text-[#F59E0B]', label: 'Departed' };
}
