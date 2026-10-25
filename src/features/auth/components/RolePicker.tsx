import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import type { AppRole } from '@/features/auth/authApi';

type RolePickerProps = {
  legend: string;
  value: AppRole | null;
  onChange: (role: AppRole) => void;
  error?: string;
  helper?: string;
};

const OPTIONS: { id: AppRole; title: string; emoji: string; description: string }[] = [
  { id: 'driver', title: 'Driver', emoji: '🚗', description: 'I want to offer rides.' },
  { id: 'rider', title: 'Rider', emoji: '👤', description: 'I want to find rides.' },
];

export function RolePicker({ legend, value, onChange, error, helper }: RolePickerProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-[#14213D]">{legend}</Text>
      {helper ? <Text className="text-sm leading-5 text-[#6B7280]">{helper}</Text> : null}
      <View className="mt-1 gap-3">
        {OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.title}. ${option.description}`}
              onPress={() => onChange(option.id)}
              className={`flex-row items-center rounded-2xl px-4 py-3.5 ${
                selected ? 'border-2 border-[#00A878] bg-[#E7F8F1]' : 'border border-[#E5E7EB] bg-white'
              }`}>
              <Text className="text-2xl">{option.emoji}</Text>
              <View className="ml-3 flex-1">
                <Text className={`text-base font-bold ${selected ? 'text-[#067A56]' : 'text-[#14213D]'}`}>
                  {option.title}
                </Text>
                <Text className="mt-0.5 text-sm text-[#6B7280]">{option.description}</Text>
              </View>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={selected ? '#00A878' : '#D1D5DB'}
              />
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="text-sm text-[#EF4444]">{error}</Text> : null}
    </View>
  );
}
