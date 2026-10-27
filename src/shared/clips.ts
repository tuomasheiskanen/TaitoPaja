// Pre-recorded audio clips, played through Web Audio for low latency.
import { audio } from './sfx';

const buffers = new Map<string, Promise<AudioBuffer | null>>();
let playing: AudioBufferSourceNode | null = null;
let token = 0;

function buffer(url: string) {
  let b = buffers.get(url);
  if (!b) {
    b = fetch(url)
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then(data => audio().decodeAudioData(data))
      .catch(() => null);
    buffers.set(url, b);
  }
  return b;
}

/** Start downloading and decoding clips so they play without delay later. */
export function preloadClips(urls: string[]) {
  urls.forEach(buffer);
}

export function stopClips() {
  token++;
  playing?.stop();
  playing = null;
}

/**
 * Play clips one after another with a pause between them.
 * Resolves false if a clip couldn't be loaded, so the caller can fall back to speech.
 */
export async function playClips(urls: string[], gap = 0.35): Promise<boolean> {
  stopClips();
  const mine = token;
  const loaded = await Promise.all(urls.map(buffer));
  if (mine !== token) return true;
  if (loaded.some(b => !b)) return false;
  const ctx = audio();
  let t = ctx.currentTime + 0.02;
  for (const b of loaded as AudioBuffer[]) {
    const src = ctx.createBufferSource();
    src.buffer = b;
    src.connect(ctx.destination);
    src.start(t);
    playing = src;
    t += b.duration + gap;
  }
  return true;
}
