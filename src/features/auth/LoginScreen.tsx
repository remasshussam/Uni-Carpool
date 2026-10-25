import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { mockSignIn, type AppRole } from '@/features/auth/authApi';
import { AuthCarBadge } from '@/features/auth/components/AuthCarBadge';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { CampusHero } from '@/features/auth/components/CampusHero';
import { RolePicker } from '@/features/auth/components/RolePicker';
import { hasFieldErrors, validateLogin, type LoginErrors, type LoginValues } from '@/features/auth/validation';
import {
  navigateToDriverHome,
  navigateToForgotPassword,
  navigateToRiderHome,
  navigateToSignUp,
} from '@/navigation/AppNavigator';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function roleFromParam(value: string | undefined): AppRole | null {
  if (value === 'driver' || value === 'rider') {
    return value;
  }
  return null;
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string | string[] }>();
  const preferredRole = roleFromParam(firstParam(params.role));
  const [values, setValues] = useState<LoginValues>({ email: '', password: '', role: preferredRole });
  const [seenRoleParam, setSeenRoleParam] = useState<AppRole | null>(preferredRole);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (preferredRole !== seenRoleParam) {
    setSeenRoleParam(preferredRole);
    setValues((current) => ({ ...current, role: preferredRole }));
    setErrors((current) => ({ ...current, role: undefined }));
  }

  const update = <K extends keyof LoginValues>(key: K, value: LoginValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    BackHandler.exitApp();
  };

  const login = async () => {
    if (loading) {
      return;
    }

    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    setFormError(null);
    if (hasFieldErrors(nextErrors) || !values.role) {
      return;
    }

    setLoading(true);
    const result = await mockSignIn(values.email, values.password, values.role);
    setLoading(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    if (result.data.role === 'rider') {
      navigateToRiderHome();
      return;
    }

    navigateToDriverHome();
  };

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <StatusBar style="dark" />
      <ScrollView keyboardShouldPersistTaps="handled" bounces={false} contentContainerClassName="grow">
        <View>
          <CampusHero />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goBack}
            className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white/85"
            style={{ top: insets.top + 8 }}>
            <Ionicons name="chevron-back" size={22} color="#14213D" />
          </Pressable>
        </View>

        <View className="-mt-14 rounded-t-[36px] bg-[#F7F9FC] px-6 pb-10">
          <View className="-mt-10 items-center">
            <AuthCarBadge />
          </View>
          <Text className="mt-3 text-center text-3xl font-bold text-[#14213D]">Uni Carpool</Text>
          <Text className="mt-1 text-center text-sm text-[#6B7280]">Share Rides. Build Connections.</Text>

          <View className="mt-6">
            <RolePicker
              legend="How would you like to continue?"
              value={values.role}
              onChange={(role) => update('role', role)}
              error={errors.role}
            />
          </View>

          <View className="mt-5 gap-4">
            <AuthTextField
              label="University Email"
              icon="mail-outline"
              value={values.email}
              onChangeText={(text) => update('email', text)}
              placeholder="Enter your university email"
              error={errors.email}
              keyboardType="email-address"
              autoComplete="email"
            />
            <AuthTextField
              label="Password"
              icon="lock-closed-outline"
              value={values.password}
              onChangeText={(text) => update('password', text)}
              placeholder="Enter your password"
              error={errors.password}
              secure
              autoComplete="password"
            />
          </View>

          {formError ? <Text className="mt-3 text-sm text-[#EF4444]">{formError}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={navigateToForgotPassword}
            disabled={loading}
            className="mt-3 self-end">
            <Text className="text-sm font-medium text-[#14213D]">Forgot Password?</Text>
          </Pressable>

          <View className="mt-5">
            <AppButton title="Login" onPress={() => void login()} loading={loading} />
          </View>

          <View className="mt-6 flex-row items-center justify-center">
            <Text className="text-sm text-[#6B7280]">{"Don't have an account? "}</Text>
            <Pressable accessibilityRole="button" onPress={navigateToSignUp} disabled={loading}>
              <Text className="text-sm font-bold text-[#14213D]">Sign Up</Text>
            </Pressable>
          </View>
          <Text className="mt-4 text-center text-xs leading-5 text-[#6B7280]">
            Demo accounts are kept in memory for this session only and disappear when the app restarts.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
