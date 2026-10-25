import { useSyncExternalStore } from 'react';

import {
  getCurrentMockRole,
  getCurrentMockSession,
  getCurrentMockUser,
  subscribeMockAuth,
} from '@/features/auth/authApi';

export function useMockUser() {
  return useSyncExternalStore(subscribeMockAuth, getCurrentMockUser, getCurrentMockUser);
}

export function useMockRole() {
  return useSyncExternalStore(subscribeMockAuth, getCurrentMockRole, getCurrentMockRole);
}

export function useMockSession() {
  return useSyncExternalStore(subscribeMockAuth, getCurrentMockSession, getCurrentMockSession);
}
