import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';

type AppInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  appearance?: 'outline' | 'soft';
  icon?: keyof typeof Ionicons.glyphMap;
};

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  editable = true,
  autoCapitalize = 'sentences',
  appearance = 'outline',
  icon,
}: AppInputProps) {
  const soft = appearance === 'soft';

  const field = (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#6B7280"
      keyboardType={keyboardType}
      editable={editable}
      autoCapitalize={autoCapitalize}
      className={
        soft
          ? 'flex-1 py-4 text-base text-[#1F2937]'
          : `rounded-xl border bg-white px-4 py-3.5 text-base text-[#1F2937] ${
              error ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
            }`
      }
    />
  );

  return (
    <View className="gap-1.5">
      <Text className={`text-sm font-semibold ${soft ? 'text-[#1F2937]' : 'text-[#14213D]'}`}>{label}</Text>
      {soft ? (
        <View
          className={`flex-row items-center rounded-2xl bg-[#F3F4F6] px-4 ${
            error ? 'border border-[#EF4444]' : ''
          }`}>
          {icon ? <Ionicons name={icon} size={18} color="#6B7280" style={{ marginRight: 10 }} /> : null}
          {field}
        </View>
      ) : (
        field
      )}
      {error ? <Text className="text-sm text-[#EF4444]">{error}</Text> : null}
    </View>
  );
}
