import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { formatRideDate, formatRideTime } from '@/lib/formatters';

type DateTimeFieldProps = {
  label: string;
  mode: 'date' | 'time';
  value: Date;
  onChange: (next: Date) => void;
  error?: string;
  appearance?: 'outline' | 'soft';
  icon?: keyof typeof Ionicons.glyphMap;
};

export function DateTimeField({
  label,
  mode,
  value,
  onChange,
  error,
  appearance = 'outline',
  icon,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const soft = appearance === 'soft';
  const display = soft
    ? mode === 'date'
      ? value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : mode === 'date'
      ? formatRideDate(value.toISOString())
      : formatRideTime(value.toISOString());

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') {
      setOpen(false);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }

    const next = new Date(value);
    if (mode === 'date') {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    } else {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }
    onChange(next);
  };

  return (
    <View className="gap-1.5">
      <Text className={`text-sm font-semibold ${soft ? 'text-[#1F2937]' : 'text-[#14213D]'}`}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className={
          soft
            ? `flex-row items-center rounded-2xl bg-[#F3F4F6] px-4 py-4 ${error ? 'border border-[#EF4444]' : ''}`
            : `rounded-xl border bg-white px-4 py-3.5 ${error ? 'border-[#EF4444]' : 'border-[#E5E7EB]'}`
        }>
        {soft && icon ? <Ionicons name={icon} size={18} color="#6B7280" style={{ marginRight: 10 }} /> : null}
        <Text className="flex-1 text-base text-[#1F2937]">{display}</Text>
      </Pressable>
      {error ? <Text className="text-sm text-[#EF4444]">{error}</Text> : null}
      {open ? (
        <View className={Platform.OS === 'ios' ? 'rounded-xl bg-white' : undefined}>
          <DateTimePicker
            value={value}
            mode={mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable onPress={() => setOpen(false)} className="items-center pb-3">
              <Text className="font-semibold text-[#00A878]">Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
