// Everything is stored only on this device.
export function loadJSON<T>(key: string): Partial<T> | null {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

export function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked; progress just won't persist.
  }
}
