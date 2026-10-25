import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

type DriverStatsCardProps = {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export function DriverStatsCard({ label, value, icon, onPress }: DriverStatsCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      onPress={onPress}
      disabled={!onPress}
      className="flex-1 rounded-2xl border border-[#E5E7EB] bg-white p-4 active:opacity-80">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-[#DDF7E8]">
        <Ionicons name={icon} size={18} color="#00A878" />
      </View>
      <Text className="text-2xl font-bold text-[#14213D]">{value}</Text>
      <Text className="mt-1 text-sm text-[#6B7280]">{label}</Text>
      {onPress ? (
        <View className="mt-2 flex-row items-center">
          <Text className="text-xs font-semibold text-[#00A878]">View</Text>
          <Ionicons name="chevron-forward" size={14} color="#00A878" />
        </View>
      ) : null}
    </Pressable>
  );
}
