import { UserPreferences } from './types';

const KEYS = {
  preferences: 'pet_preferences',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Preferences
export function getPreferences(): UserPreferences {
  return get<UserPreferences>(KEYS.preferences, { theme: 'light' });
}

export function setPreferences(prefs: UserPreferences) {
  set(KEYS.preferences, prefs);
}
