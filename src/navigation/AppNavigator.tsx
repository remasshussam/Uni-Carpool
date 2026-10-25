import { useEffect } from 'react';
import { Stack, router, useSegments, type Href } from 'expo-router';

import { showDialog } from '@/components/AppDialog';

import { mockSignOut, type AppRole } from '@/features/auth/authApi';
import { useMockRole, useMockUser } from '@/features/auth/useMockUser';

export type AppStackParamList = {
  DriverHome: undefined;
  RiderHome: undefined;
  CreateRide: undefined;
  MyRides: { tab?: 'upcoming' | 'completed' | 'canceled' };
  ManageRequests: { rideId?: string };
  EditCancelRide: { rideId: string };
  ForgotPassword: undefined;
};

export const DriverRoutes = {
  Login: '/' as Href,
  SignUp: '/sign-up' as Href,
  ForgotPassword: '/forgot-password' as Href,
  DriverHome: '/home' as Href,
  RiderHome: '/rider' as Href,
  CreateRide: '/create-ride' as const,
  MyRides: '/my-rides' as const,
  ManageRequests: '/manage-requests' as const,
  EditCancelRide: '/edit-cancel-ride' as const,
  Profile: '/profile' as const,
};

export function navigateToLogin(preferredRole?: AppRole) {
  if (preferredRole) {
    router.replace(`/?role=${preferredRole}` as Href);
    return;
  }
  router.replace(DriverRoutes.Login);
}

export function navigateToSignUp() {
  router.push(DriverRoutes.SignUp);
}

export function navigateToForgotPassword() {
  router.push(DriverRoutes.ForgotPassword);
}

export function navigateToDriverHome() {
  router.replace(DriverRoutes.DriverHome);
}

export function navigateToRiderHome() {
  router.replace(DriverRoutes.RiderHome);
}

export function logoutToLogin() {
  mockSignOut();
  router.replace(DriverRoutes.Login);
}

export function navigateToCreateRide() {
  router.push(DriverRoutes.CreateRide);
}

export function navigateToMyRides(tab?: 'upcoming' | 'completed' | 'canceled') {
  if (!tab) {
    router.replace(DriverRoutes.MyRides);
    return;
  }
  router.replace(`/my-rides?tab=${tab}&focus=${Date.now()}` as Href);
}

export function navigateToManageRequests(rideId?: string) {
  if (!rideId) {
    router.push(DriverRoutes.ManageRequests);
    return;
  }
  router.push(`/manage-requests?rideId=${encodeURIComponent(rideId)}`);
}

export function navigateToEditCancelRide(rideId: string) {
  router.push(`/edit-cancel-ride?rideId=${encodeURIComponent(rideId)}`);
}

export function navigateToProfile() {
  router.push(DriverRoutes.Profile);
}

export function navigateToNotifications() {
  showDialog({
    tone: 'info',
    title: 'Notifications',
    message:
      'Notifications are provided by the Ride Experience feature (Member 4) and are not available in this navigator yet.',
    primaryLabel: 'OK',
  });
}

function isAuthScreen(root: string | undefined) {
  return !root || root === 'index' || root === 'sign-up' || root === 'forgot-password';
}

function isRiderScreen(root: string | undefined) {
  return root === 'rider' || root === '(rider)';
}

function isDriverScreen(root: string | undefined) {
  return (
    root === '(driver)' ||
    root === 'home' ||
    root === 'my-rides' ||
    root === 'profile' ||
    root === 'create-ride' ||
    root === 'manage-requests' ||
    root === 'edit-cancel-ride'
  );
}

export default function AppNavigator() {
  const user = useMockUser();
  const role = useMockRole();
  const segments = useSegments();
  const root = segments[0];

  useEffect(() => {
    if (!root) {
      return;
    }

    if (!user || !role) {
      if (!isAuthScreen(root)) {
        router.replace('/');
      }
      return;
    }

    if (role === 'rider' && (isDriverScreen(root) || isAuthScreen(root))) {
      router.replace('/rider' as Href);
      return;
    }

    if (role === 'driver' && (isRiderScreen(root) || isAuthScreen(root))) {
      router.replace('/home');
    }
  }, [user, role, root]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="rider" />
      <Stack.Screen name="create-ride" />
      <Stack.Screen name="manage-requests" />
      <Stack.Screen name="edit-cancel-ride" />
    </Stack>
  );
}
