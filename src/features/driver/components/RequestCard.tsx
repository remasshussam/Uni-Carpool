import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { RideRequestWithRider } from '@/lib/database.types';

type RequestCardProps = {
  request: RideRequestWithRider;
  processing: boolean;
  onAccept: () => void;
  onReject: () => void;
  onOpenRider?: () => void;
};

const CARD_SHADOW = {
  shadowColor: '#14213D',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

export function RequestCard({ request, processing, onAccept, onReject, onOpenRider }: RequestCardProps) {
  const name = request.rider?.full_name?.trim() || 'Rider';
  const rating = request.rider?.average_rating;
  const reviews = request.rider?.rating_count ?? 0;
  const seatLabel = request.requested_seats === 1 ? 'seat' : 'seats';

  return (
    <View className="rounded-2xl border border-[#E5E7EB] bg-white px-4 pb-4 pt-3.5" style={CARD_SHADOW}>
      <View className="flex-row items-center">
        <RiderAvatar name={name} />
        <View className="ml-3 flex-1">
          <Text className="text-base font-bold text-[#1F2937]" numberOfLines={1}>
            {name}
          </Text>
          {rating !== null && rating !== undefined ? (
            <View className="mt-1 flex-row items-center">
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text className="ml-1 text-sm font-semibold text-[#1F2937]">{asNumber(rating).toFixed(1)}</Text>
              <Text className="text-sm text-[#6B7280]">{` (${reviews} reviews)`}</Text>
            </View>
          ) : (
            <Text className="mt-1 text-sm text-[#6B7280]">No ratings yet</Text>
          )}
          <Text className="mt-0.5 text-sm text-[#6B7280]">
            Requested {request.requested_seats} {seatLabel}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Rider profile for ${name} is not available yet`}
          onPress={onOpenRider}
          disabled={!onOpenRider}
          hitSlop={6}
          className="h-11 w-11 items-center justify-center">
          <Ionicons name="chevron-forward" size={20} color="#1F2937" />
        </Pressable>
      </View>

      <View className="mt-4 flex-row items-center justify-center gap-3">
        <DecisionButton
          label="Accept"
          tone="accept"
          onPress={onAccept}
          disabled={processing}
          loading={processing}
        />
        <DecisionButton label="Reject" tone="reject" onPress={onReject} disabled={processing} />
      </View>
    </View>
  );
}

function DecisionButton({
  label,
  tone,
  onPress,
  disabled,
  loading = false,
}: {
  label: string;
  tone: 'accept' | 'reject';
  onPress: () => void;
  disabled: boolean;
  loading?: boolean;
}) {
  const accept = tone === 'accept';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      onPress={onPress}
      style={{ width: '42%' }}
      className={`h-11 items-center justify-center rounded-xl px-4 ${
        accept ? 'bg-[#00A878]' : 'border border-[#EF4444] bg-white'
      } ${disabled ? 'opacity-50' : 'active:opacity-80'}`}>
      {loading ? (
        <ActivityIndicator color={accept ? '#FFFFFF' : '#EF4444'} />
      ) : (
        <Text className={`text-[15px] font-bold ${accept ? 'text-white' : 'text-[#EF4444]'}`}>{label}</Text>
      )}
    </Pressable>
  );
}

function RiderAvatar({ name }: { name: string }) {
  const tone = toneFor(name);

  return (
    <View
      className="h-14 w-14 items-center overflow-hidden rounded-full"
      style={{ backgroundColor: tone.bg }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: tone.fg,
          marginTop: 10,
        }}
      />
      <View
        style={{
          width: 36,
          height: 28,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          backgroundColor: tone.fg,
          marginTop: 5,
        }}
      />
    </View>
  );
}

function toneFor(name: string): { bg: string; fg: string } {
  const key = name.trim().toLowerCase();
  if (key.startsWith('sara')) {
    return { bg: '#F4D2C4', fg: '#8C4E3A' };
  }
  if (key.startsWith('omar')) {
    return { bg: '#D5E2F4', fg: '#3E5674' };
  }

  const tones = [
    { bg: '#F4D2C4', fg: '#8C4E3A' },
    { bg: '#D5E2F4', fg: '#3E5674' },
    { bg: '#D9F3E8', fg: '#0F6E52' },
    { bg: '#F8E7C4', fg: '#8A5A12' },
  ];
  const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[hash % tones.length] ?? tones[0];
}

function asNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}
