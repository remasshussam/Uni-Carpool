import type { AppRole } from '@/features/auth/authApi';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS = /\d/g;

export type LoginValues = {
  email: string;
  password: string;
  role: AppRole | null;
};

export type SignUpValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  preferredRole: AppRole | null;
};

export type LoginErrors = Partial<Record<keyof LoginValues, string>>;
export type SignUpErrors = Partial<Record<keyof SignUpValues, string>>;

export type PasswordErrors = {
  password?: string;
  confirmPassword?: string;
};

export function validateUniversityEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'University email is required.';
  }
  if (!EMAIL.test(trimmed)) {
    return 'Enter a valid email address.';
  }
  return undefined;
}

export function validatePasswordPair(password: string, confirmPassword: string): PasswordErrors {
  const errors: PasswordErrors = {};

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function validateResetCode(code: string): string | undefined {
  const trimmed = code.trim();
  if (!trimmed) {
    return 'Verification code is required.';
  }
  if (!/^\d{6}$/.test(trimmed)) {
    return 'Enter the 6-digit demo verification code.';
  }
  return undefined;
}

export function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {};
  const emailError = validateUniversityEmail(values.email);
  if (emailError) {
    errors.email = emailError;
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  }

  if (!values.role) {
    errors.role = 'Select how you would like to continue.';
  }

  return errors;
}

export function validateSignUp(values: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {};
  const fullName = values.fullName.trim();
  const emailError = validateUniversityEmail(values.email);
  const digits = values.phone.match(PHONE_DIGITS)?.length ?? 0;

  if (!fullName) {
    errors.fullName = 'Full name is required.';
  }

  if (emailError) {
    errors.email = emailError;
  }

  if (!values.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (digits < 10 || digits > 15) {
    errors.phone = 'Enter a valid phone number.';
  }

  Object.assign(errors, validatePasswordPair(values.password, values.confirmPassword));

  if (!values.preferredRole) {
    errors.preferredRole = 'Select a preferred role.';
  }

  return errors;
}

export function hasFieldErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
