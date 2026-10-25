/**
 * Phase 1 mock authentication shared by Driver and Rider.
 *
 * One account can sign in as either role. The role chosen at login is session
 * state only — it does not permanently lock the account. Passwords and reset
 * codes stay in memory for this process and are never written to AsyncStorage,
 * SecureStore, or a file. Restarting the app clears them.
 *
 * Phase 2 can replace these functions with Supabase Auth (including real
 * password recovery) without changing the screen layout.
 */

export type AppRole = 'driver' | 'rider';

export type MockUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
};

export type MockSession = {
  user: MockUser;
  role: AppRole;
};

export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: string };

type MockAccount = MockUser & {
  password: string;
  /** Demo default only. Login may still choose the other role. */
  preferredRole: AppRole;
};

type ResetCode = {
  email: string;
  code: string;
  expiresAt: number;
};

const DEMO_RESET_TTL_MS = 10 * 60 * 1000;

const accounts: MockAccount[] = [];
const resetCodes = new Map<string, ResetCode>();
let session: MockSession | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeMockAuth(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function delay(ms = 450) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toPublicUser(account: MockAccount): MockUser {
  return {
    id: account.id,
    fullName: account.fullName,
    email: account.email,
    phoneNumber: account.phoneNumber,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function findAccount(email: string) {
  return accounts.find((account) => account.email === normalizeEmail(email));
}

export async function mockSignUp(
  fullName: string,
  email: string,
  phoneNumber: string,
  password: string,
  preferredRole: AppRole,
): Promise<AuthResult<MockUser>> {
  await delay();

  const normalizedEmail = normalizeEmail(email);
  if (accounts.some((account) => account.email === normalizedEmail)) {
    return { ok: false, error: 'An account with this email already exists in this demo session.' };
  }

  const account: MockAccount = {
    id: `mock-${Date.now()}`,
    fullName: fullName.trim(),
    email: normalizedEmail,
    phoneNumber: phoneNumber.replace(/\s/g, ''),
    password,
    preferredRole,
  };
  accounts.push(account);
  return { ok: true, data: toPublicUser(account) };
}

export async function mockSignIn(
  email: string,
  password: string,
  role: AppRole,
): Promise<AuthResult<MockSession>> {
  await delay();

  const account = findAccount(email);
  if (!account || account.password !== password) {
    return { ok: false, error: 'Incorrect email or password.' };
  }

  session = { user: toPublicUser(account), role };
  notify();
  return { ok: true, data: session };
}

export function mockSignOut() {
  session = null;
  notify();
}

export function getCurrentMockUser(): MockUser | null {
  return session?.user ?? null;
}

export function getCurrentMockRole(): AppRole | null {
  return session?.role ?? null;
}

export function getCurrentMockSession(): MockSession | null {
  return session;
}

/**
 * Demo-only reset code. The code is returned to the UI so it can be shown
 * on screen. Phase 1 does not send email.
 */
export async function mockRequestPasswordReset(
  email: string,
): Promise<AuthResult<{ code: string; expiresAt: number }>> {
  await delay(350);

  const account = findAccount(email);
  if (!account) {
    return {
      ok: false,
      error:
        'No demo account uses this university email. Sign up first. Demo accounts exist only until the app restarts.',
    };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const record: ResetCode = {
    email: account.email,
    code,
    expiresAt: Date.now() + DEMO_RESET_TTL_MS,
  };
  resetCodes.set(account.email, record);
  return { ok: true, data: { code: record.code, expiresAt: record.expiresAt } };
}

function readResetCode(email: string, code: string): AuthResult<ResetCode> {
  const account = findAccount(email);
  if (!account) {
    return {
      ok: false,
      error: 'No demo account uses this university email. Demo accounts exist only until the app restarts.',
    };
  }

  const record = resetCodes.get(account.email);
  if (!record) {
    return { ok: false, error: 'Generate a demo verification code first.' };
  }
  if (Date.now() > record.expiresAt) {
    resetCodes.delete(account.email);
    return { ok: false, error: 'This demo code has expired. Generate a new code.' };
  }
  if (record.code !== code.trim()) {
    return { ok: false, error: 'That verification code is incorrect.' };
  }
  return { ok: true, data: record };
}

export async function mockVerifyResetCode(email: string, code: string): Promise<AuthResult<{ verified: true }>> {
  await delay(250);
  const result = readResetCode(email, code);
  if (!result.ok) {
    return result;
  }
  return { ok: true, data: { verified: true } };
}

export async function mockResetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<AuthResult<{ updated: true }>> {
  await delay(350);
  const result = readResetCode(email, code);
  if (!result.ok) {
    return result;
  }

  const account = findAccount(email);
  if (!account) {
    return { ok: false, error: 'No demo account uses this university email.' };
  }

  account.password = newPassword;
  resetCodes.delete(account.email);
  return { ok: true, data: { updated: true } };
}
