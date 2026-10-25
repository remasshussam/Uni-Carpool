import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { logoutToLogin } from '@/navigation/AppNavigator';

export default function ProfilePlaceholderScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <View className="bg-[#14213D] px-5 pb-5" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-lg font-bold text-white">Profile</Text>
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#DDF7E8]">
          <Ionicons name="person" size={28} color="#00A878" />
        </View>
        <Text className="text-center text-lg font-bold text-[#14213D]">Profile is owned by Member 3</Text>
        <Text className="mt-2 text-center text-sm text-[#6B7280]">
          This tab is reserved for the shared Profile feature. Driver screens read names and photos from the
          shared profiles table and do not duplicate that data.
        </Text>
        <View className="mt-8 w-full">
          <AppButton title="Log out" variant="secondary" onPress={logoutToLogin} />
        </View>
      </View>
    </View>
  );
}
