import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { showDialog } from '@/components/AppDialog';
import { mockSignUp } from '@/features/auth/authApi';
import { AuthCarBadge } from '@/features/auth/components/AuthCarBadge';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { RolePicker } from '@/features/auth/components/RolePicker';
import { hasFieldErrors, validateSignUp, type SignUpErrors, type SignUpValues } from '@/features/auth/validation';
import { navigateToLogin } from '@/navigation/AppNavigator';

const EMPTY_FORM: SignUpValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  preferredRole: null,
};

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<SignUpValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof SignUpValues>(key: K, value: SignUpValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  };

  const signUp = async () => {
    if (loading) {
      return;
    }

    const nextErrors = validateSignUp(values);
    setErrors(nextErrors);
    setFormError(null);
    if (hasFieldErrors(nextErrors) || !values.preferredRole) {
      return;
    }

    const preferredRole = values.preferredRole;
    setLoading(true);
    const result = await mockSignUp(
      values.fullName,
      values.email,
      values.phone,
      values.password,
      preferredRole,
    );
    setLoading(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    showDialog({
      tone: 'success',
      title: 'Account created',
      message:
        'You can log in with this demo account now. It stays in memory only and disappears when the app restarts. Passwords are not saved on this device.',
      primaryLabel: 'Go to Login',
      dismissible: false,
      onPrimary: () => navigateToLogin(preferredRole),
    });
  };

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-6 pb-10"
        contentContainerStyle={{ paddingTop: insets.top + 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : navigateToLogin())}
          className="h-10 w-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color="#14213D" />
        </Pressable>

        <View className="mt-4 items-center">
          <AuthCarBadge size={96} />
          <Text className="mt-5 text-center text-3xl font-bold text-[#14213D]">Create Your Account</Text>
          <Text className="mt-2 text-center text-sm text-[#6B7280]">
            Join Uni Carpool and start sharing rides!
          </Text>
        </View>

        <View className="mt-8 gap-4">
          <AuthTextField
            label="Full Name"
            icon="person-outline"
            value={values.fullName}
            onChangeText={(text) => update('fullName', text)}
            placeholder="Enter your full name"
            error={errors.fullName}
            autoCapitalize="words"
            autoComplete="name"
          />
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
            label="Phone Number"
            icon="call-outline"
            value={values.phone}
            onChangeText={(text) => update('phone', text)}
            placeholder="Enter your phone number"
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <AuthTextField
            label="Password"
            icon="lock-closed-outline"
            value={values.password}
            onChangeText={(text) => update('password', text)}
            placeholder="Create a password"
            error={errors.password}
            secure
            autoComplete="password-new"
          />
          <AuthTextField
            label="Confirm Password"
            icon="lock-closed-outline"
            value={values.confirmPassword}
            onChangeText={(text) => update('confirmPassword', text)}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
            secure
            autoComplete="password-new"
          />
          <RolePicker
            legend="Preferred Role"
            helper="This is the default for the demo. You can still choose Driver or Rider each time you log in."
            value={values.preferredRole}
            onChange={(role) => update('preferredRole', role)}
            error={errors.preferredRole}
          />
        </View>

        {formError ? <Text className="mt-3 text-sm text-[#EF4444]">{formError}</Text> : null}

        <View className="mt-8">
          <AppButton title="Sign Up" onPress={() => void signUp()} loading={loading} />
        </View>

        <View className="mt-6 flex-row items-center justify-center">
          <Text className="text-sm text-[#6B7280]">Already have an account? </Text>
          <Pressable accessibilityRole="button" onPress={() => navigateToLogin()} disabled={loading}>
            <Text className="text-sm font-bold text-[#14213D]">Login</Text>
          </Pressable>
        </View>
        <Text className="mt-4 text-center text-xs leading-5 text-[#6B7280]">
          Demo accounts are temporary. They stay in memory for this session and disappear when the app restarts.
          Passwords are not saved on this device.
        </Text>
      </ScrollView>
    </View>
  );
}
