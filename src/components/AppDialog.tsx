import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type DialogTone = 'success' | 'error' | 'warning' | 'info';

type DialogOptions = {
  title: string;
  message?: string;
  tone?: DialogTone;
  primaryLabel?: string;
  onPrimary?: () => void | Promise<void>;
  secondaryLabel?: string;
  onSecondary?: () => void;
  destructive?: boolean;
  dismissible?: boolean;
};

type ActiveDialog = DialogOptions & { id: number };

const toneStyles: Record<DialogTone, { background: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { background: '#00A878', icon: 'checkmark' },
  error: { background: '#EF4444', icon: 'close' },
  warning: { background: '#F59E0B', icon: 'warning' },
  info: { background: '#14213D', icon: 'information' },
};

let nextId = 0;
let active: ActiveDialog | null = null;
const listeners = new Set<(dialog: ActiveDialog | null) => void>();

function emit() {
  listeners.forEach((listener) => listener(active));
}

function activeDialogId() {
  return active?.id ?? null;
}

export function showDialog(options: DialogOptions) {
  nextId += 1;
  active = {
    tone: 'info',
    primaryLabel: 'OK',
    dismissible: true,
    ...options,
    id: nextId,
  };
  emit();
}

export function hideDialog() {
  if (!active) {
    return;
  }
  active = null;
  emit();
}

function isPromise(value: void | Promise<void>): value is Promise<void> {
  return typeof (value as Promise<void> | undefined)?.then === 'function';
}

export function DialogHost() {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    const listener = (next: ActiveDialog | null) => {
      busyRef.current = false;
      setDialog(next);
      setBusy(false);
    };
    listeners.add(listener);
    listener(active);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const run = async (action: (() => void | Promise<void>) | undefined) => {
    if (!dialog || busyRef.current) {
      return;
    }

    const id = dialog.id;
    if (!action) {
      hideDialog();
      return;
    }

    try {
      const pending = action();
      if (isPromise(pending)) {
        busyRef.current = true;
        setBusy(true);
        await pending;
      }
      if (activeDialogId() === id) {
        hideDialog();
      }
    } finally {
      if (activeDialogId() === id || activeDialogId() === null) {
        busyRef.current = false;
        setBusy(false);
      }
    }
  };

  const dismiss = () => {
    if (!dialog || busyRef.current || dialog.dismissible === false) {
      return;
    }
    hideDialog();
  };

  const tone = toneStyles[dialog?.tone ?? 'info'];
  const primaryLabel = dialog?.primaryLabel ?? 'OK';
  const primaryColor = dialog?.destructive ? '#EF4444' : '#00A878';

  return (
    <Modal
      visible={dialog !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!dialog || busyRef.current) {
          return;
        }
        if (dialog.dismissible === false) {
          void run(dialog.onPrimary);
          return;
        }
        hideDialog();
      }}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
          style={styles.scrim}
          onPress={dismiss}
        />
        {dialog ? (
          <View style={styles.card} onStartShouldSetResponder={() => true}>
            <View style={[styles.icon, { backgroundColor: tone.background }]}>
              <Ionicons name={tone.icon} size={34} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>{dialog.title}</Text>
            {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy, busy }}
              disabled={busy}
              onPress={() => void run(dialog.onPrimary)}
              style={[styles.primaryButton, { backgroundColor: primaryColor, opacity: busy ? 0.7 : 1 }]}>
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryLabel}>{primaryLabel}</Text>
              )}
            </Pressable>
            {dialog.secondaryLabel ? (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void run(dialog.onSecondary)}
                style={styles.secondaryButton}>
                <Text style={styles.secondaryLabel}>{dialog.secondaryLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    shadowColor: '#14213D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: '#14213D',
  },
  message: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: '#8B95A8',
  },
  primaryButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    marginTop: 12,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  secondaryLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#14213D',
  },
});
