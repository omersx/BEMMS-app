import fs from 'fs';
import path from 'path';

function createWavHeader(dataLength: number, sampleRate = 44100, numChannels = 1, bitsPerSample = 16) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

// 1. Notification Chime: 3 sweet ascending tones (E5, A5, C#6)
function generateNotificationChime(): Buffer {
  const sampleRate = 44100;
  const duration = 0.6; // 600ms
  const numSamples = Math.floor(sampleRate * duration);
  const data = Buffer.alloc(numSamples * 2);

  const notes = [
    { freq: 659.25, start: 0.0, end: 0.25 },
    { freq: 880.00, start: 0.15, end: 0.40 },
    { freq: 1108.73, start: 0.30, end: 0.60 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const note of notes) {
      if (t >= note.start && t <= note.end) {
        const noteT = t - note.start;
        const noteDur = note.end - note.start;
        // Envelope: quick attack (15ms), smooth exponential decay
        const attack = Math.min(1.0, noteT / 0.015);
        const decay = Math.exp(-4.5 * (noteT / noteDur));
        const env = attack * decay;
        // Harmonic richness: fundamental + soft 2nd harmonic
        const wave = Math.sin(2 * Math.PI * note.freq * noteT) + 0.3 * Math.sin(2 * Math.PI * note.freq * 2 * noteT);
        sample += wave * env * 0.4;
      }
    }

    sample = Math.max(-1.0, Math.min(1.0, sample));
    const intSample = Math.floor(sample * 32767);
    data.writeInt16LE(intSample, i * 2);
  }

  const header = createWavHeader(data.length, sampleRate);
  return Buffer.concat([header, data]);
}

// 2. Urgent Alarm: 2 urgent high-pitch pulses
function generateUrgentAlarm(): Buffer {
  const sampleRate = 44100;
  const duration = 0.55;
  const numSamples = Math.floor(sampleRate * duration);
  const data = Buffer.alloc(numSamples * 2);

  const pulses = [
    { start: 0.0, end: 0.22 },
    { start: 0.28, end: 0.50 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const pulse of pulses) {
      if (t >= pulse.start && t <= pulse.end) {
        const pulseT = t - pulse.start;
        const pulseDur = pulse.end - pulse.start;
        // Pitch ramp 880 -> 1320
        const freq = 880 + (1320 - 880) * (pulseT / pulseDur);
        const attack = Math.min(1.0, pulseT / 0.01);
        const decay = Math.exp(-3.5 * (pulseT / pulseDur));
        const env = attack * decay;
        sample += Math.sin(2 * Math.PI * freq * pulseT) * env * 0.6;
      }
    }

    sample = Math.max(-1.0, Math.min(1.0, sample));
    const intSample = Math.floor(sample * 32767);
    data.writeInt16LE(intSample, i * 2);
  }

  const header = createWavHeader(data.length, sampleRate);
  return Buffer.concat([header, data]);
}

// 3. QR Beep: quick crisp chirp
function generateQrBeep(): Buffer {
  const sampleRate = 44100;
  const duration = 0.18;
  const numSamples = Math.floor(sampleRate * duration);
  const data = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // rising pitch from 1200 to 1800
    const freq = 1200 + (1800 - 1200) * (t / duration);
    const attack = Math.min(1.0, t / 0.01);
    const decay = Math.exp(-4.0 * (t / duration));
    const sample = Math.sin(2 * Math.PI * freq * t) * attack * decay * 0.5;

    const intSample = Math.floor(sample * 32767);
    data.writeInt16LE(intSample, i * 2);
  }

  const header = createWavHeader(data.length, sampleRate);
  return Buffer.concat([header, data]);
}

const dir = path.join(process.cwd(), 'public', 'sounds');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(path.join(dir, 'notification.wav'), generateNotificationChime());
fs.writeFileSync(path.join(dir, 'urgent.wav'), generateUrgentAlarm());
fs.writeFileSync(path.join(dir, 'beep.wav'), generateQrBeep());
console.log('Generated notification.wav, urgent.wav, beep.wav in public/sounds/');
