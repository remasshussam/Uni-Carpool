import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View, type KeyboardTypeOptions, type TextInputProps } from 'react-native';

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
};

export function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  icon,
  secure = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
}: AuthTextFieldProps) {
  const [hidden, setHidden] = useState(secure);

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-[#4B5563]">{label}</Text>
      <View
        className={`flex-row items-center rounded-2xl border bg-white px-3 ${
          error ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
        }`}>
        {icon ? <Ionicons name={icon} size={18} color="#2563EB" /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          secureTextEntry={secure && hidden}
          className={`flex-1 py-3.5 text-base text-[#1F2937] ${icon ? 'px-3' : 'px-1'}`}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((current) => !current)}
            hitSlop={8}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color="#9CA3AF" />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-[#EF4444]">{error}</Text> : null}
    </View>
  );
}
