/**
 * BEMMS Sound & Native Notification Utilities
 *
 * Provides a resilient multi-tier audio & notification pipeline:
 * 1. HTML5 Audio using pre-rendered WAV assets in /sounds/
 * 2. Web Audio API programmatic tone synthesis fallback
 * 3. Native mobile device haptic vibration (navigator.vibrate)
 * 4. Native OS Notification popups (Desktop + Mobile) with native system sound
 */

let audioContext: AudioContext | null = null;
let isAudioUnlocked = false;

// Audio element cache for instant playback
let notificationAudio: HTMLAudioElement | null = null;
let urgentAudio: HTMLAudioElement | null = null;
let beepAudio: HTMLAudioElement | null = null;

function getAudioElement(src: string): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  try {
    const audio = new Audio(src);
    audio.preload = 'auto';
    return audio;
  } catch {
    return null;
  }
}

function initAudioElements() {
  if (typeof window === 'undefined') return;
  if (!notificationAudio) notificationAudio = getAudioElement('/sounds/notification.wav');
  if (!urgentAudio) urgentAudio = getAudioElement('/sounds/urgent.wav');
  if (!beepAudio) beepAudio = getAudioElement('/sounds/beep.wav');
}

/**
 * Get or create the shared AudioContext.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
  }

  return audioContext;
}

/**
 * Ensure the AudioContext is resumed before scheduling audio nodes.
 */
async function ensureAudioContext(): Promise<AudioContext | null> {
  const ctx = getAudioContext();
  if (!ctx) return null;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // Browser autoplay policy might block if no user gesture yet
    }
  }

  return ctx;
}

// ── Native Mobile Vibration ──────────────────────────────────────────────────────

export function triggerVibration(pattern: number[] = [200, 100, 200]): void {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }
}

// ── Unlock Audio on User Gesture ─────────────────────────────────────────────────

/**
 * Call this on any user interaction (tap, click, keydown) to unlock audio playback.
 * Unlocks both the Web Audio API AudioContext and HTML5 Audio elements on mobile Safari and Chrome.
 */
export async function unlockAudio(): Promise<void> {
  if (typeof window === 'undefined') return;

  initAudioElements();

  // 1. Unlock AudioContext
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // Ignore
    }
  }

  // 2. Play silent HTML5 audio sample to unlock audio pipeline
  if (notificationAudio && !isAudioUnlocked) {
    try {
      notificationAudio.volume = 0.01;
      const playPromise = notificationAudio.play();
      if (playPromise !== undefined) {
        await playPromise;
        notificationAudio.pause();
        notificationAudio.currentTime = 0;
        notificationAudio.volume = 1.0;
        isAudioUnlocked = true;
      }
    } catch {
      // May fail if interaction wasn't trusted, will retry on next interaction
    }
  }
}

// ── Play Sound Helpers ───────────────────────────────────────────────────────────

async function playAudioFileWithFallback(
  audio: HTMLAudioElement | null,
  fallbackFn: () => Promise<void>
): Promise<void> {
  initAudioElements();

  if (audio) {
    try {
      audio.currentTime = 0;
      audio.volume = 1.0;
      await audio.play();
      return;
    } catch {
      // HTML5 audio playback failed (e.g. autoplay restriction or missing file), proceed to Web Audio fallback
    }
  }

  await fallbackFn();
}

// ── 1. Notification Sound (Chime) ─────────────────────────────────────────────────

async function synthesizeNotificationChime(ctx: AudioContext): Promise<void> {
  const now = ctx.currentTime;
  const tones = [
    { freq: 659.25, start: 0.0, duration: 0.2 },
    { freq: 880.0, start: 0.12, duration: 0.22 },
    { freq: 1108.73, start: 0.24, duration: 0.35 },
  ];

  tones.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.35, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration);
  });
}

/**
 * Play a pleasant notification chime for incoming alerts (new ticket, status change, etc.).
 * Uses HTML5 audio asset with Web Audio synthesis fallback + mobile haptic vibration.
 */
export async function playNotificationSound(): Promise<void> {
  // Mobile haptic vibration
  triggerVibration([150, 75, 150]);

  await playAudioFileWithFallback(notificationAudio, async () => {
    const ctx = await ensureAudioContext();
    if (ctx && ctx.state === 'running') {
      await synthesizeNotificationChime(ctx);
    }
  });
}

// ── 2. Urgent Notification Sound (Alarm) ──────────────────────────────────────────

async function synthesizeUrgentAlarm(ctx: AudioContext): Promise<void> {
  const now = ctx.currentTime;

  for (let i = 0; i < 2; i++) {
    const offset = i * 0.28;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now + offset);
    osc.frequency.linearRampToValueAtTime(1320, now + offset + 0.18);

    gain.gain.setValueAtTime(0, now + offset);
    gain.gain.linearRampToValueAtTime(0.4, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.22);
  }
}

/**
 * Play an urgent/critical notification sound for critical tickets (patient care affected).
 */
export async function playUrgentNotificationSound(): Promise<void> {
  // Urgent vibration pattern
  triggerVibration([250, 100, 250, 100, 250]);

  await playAudioFileWithFallback(urgentAudio, async () => {
    const ctx = await ensureAudioContext();
    if (ctx && ctx.state === 'running') {
      await synthesizeUrgentAlarm(ctx);
    }
  });
}

// ── 3. QR Scan Beep ──────────────────────────────────────────────────────────────

async function synthesizeQrBeep(ctx: AudioContext): Promise<void> {
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.linearRampToValueAtTime(1800, now + 0.12);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.16);
}

/**
 * Play a short, clear chirp when a QR code is captured.
 */
export async function playQrBeep(): Promise<void> {
  triggerVibration([75]);

  await playAudioFileWithFallback(beepAudio, async () => {
    const ctx = await ensureAudioContext();
    if (ctx && ctx.state === 'running') {
      await synthesizeQrBeep(ctx);
    }
  });
}

// ── 4. Native OS Notification (Desktop & Mobile) ─────────────────────────────────

export interface NativeNotificationOptions {
  title: string;
  body: string;
  actionUrl?: string;
  tag?: string;
  isCritical?: boolean;
}

/**
 * Request permission for native system notifications if not already granted.
 */
export async function requestNativeNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * Display a native operating system notification popup with system notification sound.
 * Works on desktop (Windows, macOS, Linux) and mobile (Android Chrome, iOS Safari PWA).
 */
export async function showNativeNotification(options: NativeNotificationOptions): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const {
    title,
    body,
    actionUrl = '/notifications',
    tag = `bemms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    isCritical = false,
  } = options;

  const notifOptions: NotificationOptions & { renotify?: boolean } = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag,
    renotify: true,
    silent: false, // Explicitly tell OS to play its native notification sound
    requireInteraction: isCritical,
    data: { url: actionUrl },
  };

  try {
    // Prefer Service Worker showNotification if available (works on mobile Android & iOS PWA)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notifOptions);
        return;
      }
    }

    // Fallback to standard Window Notification constructor
    const n = new Notification(title, notifOptions);
    n.onclick = () => {
      window.focus();
      if (actionUrl) {
        window.location.href = actionUrl;
      }
      n.close();
    };
  } catch {
    // Some browsers reject Notification if constructed in certain contexts
  }
}
