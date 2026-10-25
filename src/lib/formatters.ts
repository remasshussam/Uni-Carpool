export function formatRideDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRideTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Compact schedule line, for example "Thu, Oct 29 – 8:00 AM". */
export function formatRideSchedule(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} – ${time}`;
}

export function formatFare(fare: number): string {
  return `EGP ${fare.toFixed(fare % 1 === 0 ? 0 : 2)}`;
}

export function firstNameFrom(fullName: string | null | undefined, fallback = 'Driver'): string {
  const trimmed = fullName?.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.split(/\s+/)[0] ?? fallback;
}
