import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'car-outline',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-10">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-[#DDF7E8]">
        <Ionicons name={icon} size={28} color="#00A878" />
      </View>
      <Text className="text-center text-base font-semibold text-[#14213D]">{title}</Text>
      {message ? <Text className="mt-2 text-center text-sm text-[#6B7280]">{message}</Text> : null}
      {actionLabel && onAction ? (
        <View className="mt-5 w-full">
          <AppButton title={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
