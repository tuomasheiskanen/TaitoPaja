// Finnish text-to-speech via the browser's built-in voices.
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
let token = 0;

function finnishVoice() {
  return synth?.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith('fi'));
}

function utterance(text: string) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fi-FI';
  u.rate = 0.7;
  const v = finnishVoice();
  if (v) u.voice = v;
  return u;
}

/** Voices load asynchronously on some browsers; ask early so they are ready. */
export function warmUpVoices() {
  synth?.getVoices();
}

export function stopSpeech() {
  token++;
  synth?.cancel();
}

export function say(text: string) {
  if (!synth) return;
  stopSpeech();
  synth.speak(utterance(text));
}

/** Speak parts one after another with a pause in between, e.g. syllables of a word. */
export function sayParts(parts: string[], gap = 450) {
  if (!synth) return;
  stopSpeech();
  const mine = token;
  const step = (i: number) => {
    if (i >= parts.length || mine !== token) return;
    const u = utterance(parts[i].toLowerCase());
    let done = false;
    // Some engines never fire onend, so fall back to a timer.
    const fallback = setTimeout(() => go(), 600 + parts[i].length * 220);
    const go = () => {
      if (done) return;
      done = true;
      clearTimeout(fallback);
      setTimeout(() => step(i + 1), gap);
    };
    u.onend = go;
    u.onerror = go;
    synth.speak(u);
  };
  setTimeout(() => step(0), 60);
}
