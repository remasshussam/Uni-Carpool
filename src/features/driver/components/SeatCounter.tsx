import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { MAX_SEATS, MIN_SEATS } from '@/features/driver/rideValidation';

type SeatCounterProps = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  error?: string;
  helper?: string;
  appearance?: 'outline' | 'soft';
  icon?: keyof typeof Ionicons.glyphMap;
};

export function SeatCounter({
  label,
  value,
  onChange,
  min = MIN_SEATS,
  max = MAX_SEATS,
  error,
  helper,
  appearance = 'outline',
  icon,
}: SeatCounterProps) {
  const soft = appearance === 'soft';

  return (
    <View className="gap-1.5">
      <Text className={`text-sm font-semibold ${soft ? 'text-[#1F2937]' : 'text-[#14213D]'}`}>{label}</Text>
      <View
        className={
          soft
            ? `flex-row items-center rounded-2xl bg-[#F3F4F6] px-3 py-2 ${error ? 'border border-[#EF4444]' : ''}`
            : 'flex-row items-center rounded-xl border border-[#E5E7EB] bg-white px-4 py-2'
        }>
        {soft && icon ? <Ionicons name={icon} size={18} color="#6B7280" style={{ marginLeft: 4, marginRight: 6 }} /> : null}
        <View className="flex-1 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Decrease seats"
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - 1))}
          className={`h-10 w-10 items-center justify-center rounded-full ${soft ? 'bg-white' : 'bg-[#F7F9FC]'} ${
            value <= min ? 'opacity-40' : ''
          }`}>
          <Ionicons name="remove" size={20} color="#14213D" />
        </Pressable>
        <Text className="text-xl font-bold text-[#14213D]">{value}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Increase seats"
          disabled={value >= max}
          onPress={() => onChange(Math.min(max, value + 1))}
          className={`h-10 w-10 items-center justify-center rounded-full bg-[#DDF7E8] ${
            value >= max ? 'opacity-40' : ''
          }`}>
          <Ionicons name="add" size={20} color="#00A878" />
        </Pressable>
        </View>
      </View>
      {helper ? <Text className="text-sm text-[#6B7280]">{helper}</Text> : null}
      {error ? <Text className="text-sm text-[#EF4444]">{error}</Text> : null}
    </View>
  );
}
