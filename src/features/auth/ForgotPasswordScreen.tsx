import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import {
  mockRequestPasswordReset,
  mockResetPassword,
  mockVerifyResetCode,
} from '@/features/auth/authApi';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import {
  validatePasswordPair,
  validateResetCode,
  validateUniversityEmail,
} from '@/features/auth/validation';
import { navigateToLogin } from '@/navigation/AppNavigator';

type Step = 'email' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [codeVerified, setCodeVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<'continue' | 'verify' | 'reset' | 'regenerate' | null>(null);
  const loading = pending !== null;

  const goBack = () => {
    if (step === 'reset') {
      setStep('email');
      setFormError(null);
      return;
    }
    navigateToLogin();
  };

  const continueWithEmail = async () => {
    if (loading) {
      return;
    }

    const nextEmailError = validateUniversityEmail(email);
    setEmailError(nextEmailError);
    setFormError(null);
    if (nextEmailError) {
      return;
    }

    setPending('continue');
    const result = await mockRequestPasswordReset(email);
    setPending(null);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setDemoCode(result.data.code);
    setCode('');
    setCodeError(undefined);
    setCodeVerified(false);
    setPassword('');
    setConfirmPassword('');
    setPasswordError(undefined);
    setConfirmError(undefined);
    setStep('reset');
  };

  const generateAnotherCode = async () => {
    if (loading) {
      return;
    }

    setPending('regenerate');
    const result = await mockRequestPasswordReset(email);
    setPending(null);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setDemoCode(result.data.code);
    setCode('');
    setCodeError(undefined);
    setCodeVerified(false);
    setFormError(null);
  };

  const verifyCode = async () => {
    if (loading) {
      return;
    }

    const nextCodeError = validateResetCode(code);
    setCodeError(nextCodeError);
    setFormError(null);
    setCodeVerified(false);
    if (nextCodeError) {
      return;
    }

    setPending('verify');
    const result = await mockVerifyResetCode(email, code);
    setPending(null);

    if (!result.ok) {
      setCodeError(result.error);
      return;
    }

    setCodeVerified(true);
  };

  const resetPassword = async () => {
    if (loading) {
      return;
    }

    const nextCodeError = validateResetCode(code);
    const passwordErrors = validatePasswordPair(password, confirmPassword);
    setCodeError(nextCodeError);
    setPasswordError(passwordErrors.password);
    setConfirmError(passwordErrors.confirmPassword);
    setFormError(null);
    if (nextCodeError || passwordErrors.password || passwordErrors.confirmPassword) {
      return;
    }

    setPending('reset');
    const result = await mockResetPassword(email, code, password);
    setPending(null);

    if (!result.ok) {
      setCodeVerified(false);
      setCodeError(result.error);
      return;
    }

    setStep('done');
  };

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <StatusBar style="light" />
      <View className="bg-[#14213D] px-5 pb-8" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View className="mt-4 items-center">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#00A878]">
            <Ionicons name="mail" size={26} color="#FFFFFF" />
          </View>
          <Text className="mt-3 text-lg font-bold text-white">Uni Carpool</Text>
        </View>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="-mt-4 flex-1 rounded-t-[28px] bg-[#F7F9FC]"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-6 pb-12 pt-8">
          {step === 'email' ? (
            <View>
              <Text className="text-center text-3xl font-bold text-[#14213D]">Forgot Password?</Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#6B7280]">
                Enter your university email to reset your password.
              </Text>
              <Text className="mt-3 text-center text-sm leading-5 text-[#6B7280]">
                This is a demo reset. No email is sent. Demo accounts stay in memory and disappear when the app
                restarts.
              </Text>

              <View className="mt-8">
                <AuthTextField
                  label="University Email"
                  icon="mail-outline"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError(undefined);
                    setFormError(null);
                  }}
                  placeholder="Enter your university email"
                  error={emailError}
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              {formError ? <Text className="mt-3 text-sm text-[#EF4444]">{formError}</Text> : null}

              <View className="mt-6">
                <AppButton
                  title="Continue"
                  onPress={() => void continueWithEmail()}
                  loading={pending === 'continue'}
                  disabled={loading}
                />
              </View>
              <Pressable accessibilityRole="button" onPress={() => navigateToLogin()} className="mt-5 items-center">
                <Text className="text-sm font-semibold text-[#14213D]">Back to Login</Text>
              </Pressable>
            </View>
          ) : null}

          {step === 'reset' ? (
            <View>
              <Text className="text-center text-3xl font-bold text-[#14213D]">Reset Password</Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#6B7280]">
                Verify the demo code, then choose a new password for {email.trim()}.
              </Text>

              {demoCode ? (
                <View className="mt-6 rounded-2xl border border-[#00A878]/30 bg-[#E7F8F1] px-4 py-4">
                  <Text className="text-xs font-bold uppercase text-[#067A56]">Demo verification code</Text>
                  <Text
                    className="mt-1 text-center text-3xl font-bold text-[#14213D]"
                    style={{ letterSpacing: 6 }}>
                    {demoCode}
                  </Text>
                  <Text className="mt-2 text-sm leading-5 text-[#3F6212]">
                    Shown here for the Phase 1 demo. No email was sent. The code expires in 10 minutes.
                  </Text>
                </View>
              ) : null}

              <View className="mt-6 gap-4">
                <AuthTextField
                  label="Verification Code"
                  icon="key-outline"
                  value={code}
                  onChangeText={(text) => {
                    setCode(text.replace(/[^\d]/g, '').slice(0, 6));
                    setCodeError(undefined);
                    setCodeVerified(false);
                    setFormError(null);
                  }}
                  placeholder="6-digit code"
                  error={codeError}
                  keyboardType="number-pad"
                />
                <AuthTextField
                  label="New Password"
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError(undefined);
                  }}
                  placeholder="At least 8 characters"
                  error={passwordError}
                  secure
                  autoComplete="password-new"
                />
                <AuthTextField
                  label="Confirm New Password"
                  icon="lock-closed-outline"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setConfirmError(undefined);
                  }}
                  placeholder="Repeat the new password"
                  error={confirmError}
                  secure
                  autoComplete="password-new"
                />
              </View>

              {codeVerified ? (
                <Text className="mt-3 text-sm font-medium text-[#067A56]">
                  Code verified. You can reset the password.
                </Text>
              ) : null}
              {formError ? <Text className="mt-3 text-sm text-[#EF4444]">{formError}</Text> : null}

              <View className="mt-6 gap-3">
                <AppButton
                  title="Verify Code"
                  variant="secondary"
                  onPress={() => void verifyCode()}
                  loading={pending === 'verify'}
                  disabled={loading}
                />
                <AppButton
                  title="Reset Password"
                  onPress={() => void resetPassword()}
                  loading={pending === 'reset'}
                  disabled={loading}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => void generateAnotherCode()}
                disabled={loading}
                className="mt-4 items-center">
                <Text className="text-sm font-semibold text-[#00A878]">Generate a new code</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => navigateToLogin()} className="mt-3 items-center">
                <Text className="text-sm font-semibold text-[#14213D]">Back to Login</Text>
              </Pressable>
            </View>
          ) : null}

          {step === 'done' ? (
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#E7F8F1]">
                <Ionicons name="checkmark-circle" size={40} color="#00A878" />
              </View>
              <Text className="mt-5 text-center text-2xl font-bold text-[#14213D]">
                Password Reset Successfully!
              </Text>
              <Text className="mt-3 text-center text-sm leading-5 text-[#6B7280]">
                Log in with the new password during this demo session. It is stored in memory only and disappears
                when the app restarts.
              </Text>
              <View className="mt-8 w-full">
                <AppButton title="Back to Login" onPress={() => navigateToLogin()} />
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
