import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { useMockUser } from '@/features/auth/useMockUser';
import { firstNameFrom } from '@/lib/formatters';
import { logoutToLogin } from '@/navigation/AppNavigator';

/**
 * Temporary Phase 1 rider landing.
 * Replace this screen when the Rider feature (search, details, join, my requests)
 * is integrated. Login already routes riders here instead of Driver Home.
 */
export default function RiderHomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useMockUser();
  const name = firstNameFrom(user?.fullName, 'there');

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <StatusBar style="light" />
      <View className="bg-[#14213D] px-5 pb-6" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#00A878]">
            <Ionicons name="person" size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text className="text-lg font-bold text-white">Uni Carpool</Text>
            <Text className="text-xs text-white/70">Rider</Text>
          </View>
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#DDF7E8]">
          <Ionicons name="car-sport" size={30} color="#00A878" />
        </View>
        <Text className="text-center text-2xl font-bold text-[#14213D]">Welcome to Uni Carpool!</Text>
        <Text className="mt-2 text-center text-base text-[#6B7280]">Hello, {name}.</Text>
        <Text className="mt-3 text-center text-sm leading-5 text-[#6B7280]">Rider features are coming soon.</Text>
        <View className="mt-8 w-full">
          <AppButton title="Logout" variant="secondary" onPress={logoutToLogin} />
        </View>
      </View>
    </View>
  );
}
