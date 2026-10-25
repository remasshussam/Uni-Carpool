import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** `sheet` is the flat navy bar used when a white rounded sheet sits underneath. */
  variant?: 'default' | 'sheet';
};

export function ScreenHeader({ title, subtitle, onBack, right, variant = 'default' }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  if (variant === 'sheet') {
    return (
      <View className="bg-[#14213D]" style={{ paddingTop: insets.top }}>
        <View className="h-[62px] items-center justify-center">
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              hitSlop={8}
              className="absolute left-2 h-11 w-11 items-center justify-center">
              <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
            </Pressable>
          ) : null}
          <Text className="px-14 text-center text-lg font-semibold text-white" numberOfLines={1}>
            {title}
          </Text>
          {right ? <View className="absolute right-4">{right}</View> : null}
        </View>
      </View>
    );
  }

  return (
    <View className="bg-[#14213D] px-5 pb-5" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center justify-between">
        <View className="min-h-[40px] w-10 items-start justify-center">
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>
        <View className="flex-1 items-center px-2">
          <Text className="text-lg font-bold text-white">{title}</Text>
          {subtitle ? <Text className="mt-0.5 text-xs text-white/70">{subtitle}</Text> : null}
        </View>
        <View className="min-h-[40px] w-10 items-end justify-center">{right}</View>
      </View>
    </View>
  );
}
