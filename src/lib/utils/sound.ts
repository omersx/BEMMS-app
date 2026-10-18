/**
 * BEMMS Sound Utilities
 *
 * Uses the Web Audio API to synthesize sounds programmatically.
 * No external audio files needed — works on all modern browsers and native devices.
 *
 * Web Audio API is supported on iOS Safari, Android Chrome, and all desktop browsers.
 * On mobile, sounds require a prior user gesture (tap) to unlock the AudioContext.
 */

let audioContext: AudioContext | null = null;

/**
 * Get or create the shared AudioContext.
 * Must be called after a user gesture on mobile to unlock audio.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
  }

  // Resume if suspended (required on mobile after tab switch / background)
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

// ── QR Scan Beep ─────────────────────────────────────────────────────────────────

/**
 * Play a short, clear "beep" to indicate a successful QR scan.
 * Two-tone chirp that feels satisfying and professional on mobile devices.
 */
export function playQrBeep(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // --- Tone 1: rising chirp ---
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1200, now);
  osc1.frequency.linearRampToValueAtTime(1800, now + 0.08);
  gain1.gain.setValueAtTime(0.35, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.12);

  // --- Tone 2: confirmation note ---
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1800, now + 0.1);
  gain2.gain.setValueAtTime(0, now + 0.1);
  gain2.gain.linearRampToValueAtTime(0.35, now + 0.12);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.1);
  osc2.stop(now + 0.3);
}

// ── Notification Sound ───────────────────────────────────────────────────────────

/**
 * Play a pleasant notification chime for incoming alerts (new ticket, status change, etc.).
 * Three ascending tones — distinct from the QR beep, gentle but attention-grabbing.
 */
export function playNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const tones = [
    { freq: 660, start: 0, duration: 0.15 },      // E5
    { freq: 880, start: 0.15, duration: 0.15 },    // A5
    { freq: 1100, start: 0.30, duration: 0.25 },   // ~C#6
  ];

  tones.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.25, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration);
  });
}

/**
 * Play an urgent/critical notification sound — louder and more insistent.
 * Used for critical priority tickets (patient care affected).
 */
export function playUrgentNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Rapid two-pulse alarm tone
  for (let i = 0; i < 2; i++) {
    const offset = i * 0.3;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now + offset);
    osc.frequency.linearRampToValueAtTime(1320, now + offset + 0.1);
    gain.gain.setValueAtTime(0.2, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.2);
  }
}

// ── Unlock Audio on First User Gesture ───────────────────────────────────────────

/**
 * Call this once on a user interaction (tap/click) to unlock audio on mobile devices.
 * After this, sounds can play without further user gestures.
 * Plays a silent buffer to unlock the AudioContext.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Create and play a silent buffer to unlock
  const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}
