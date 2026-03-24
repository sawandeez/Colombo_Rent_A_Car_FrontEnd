import type { User } from '../types';

type ProfileCacheMap = Record<string, Partial<User>>;

const PROFILE_CACHE_KEY = 'user-profile-cache-v1';

const readCache = (): ProfileCacheMap => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProfileCacheMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeCache = (cache: ProfileCacheMap) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage failures (private mode/quota).
  }
};

const normalize = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const keyForId = (id?: string) => {
  const normalized = normalize(id);
  return normalized ? `id:${normalized}` : undefined;
};

const keyForEmail = (email?: string) => {
  const normalized = normalize(email)?.toLowerCase();
  return normalized ? `email:${normalized}` : undefined;
};

const mergeUserWithCached = (user: User, cached?: Partial<User>): User => ({
  ...cached,
  ...user,
  name: normalize(user.name) || normalize(cached?.name) || '',
  email: normalize(user.email) || normalize(cached?.email) || '',
  phone: normalize(user.phone) || normalize(cached?.phone) || '',
  district: normalize(user.district) || normalize(cached?.district) || '',
  city: normalize(user.city) || normalize(cached?.city) || '',
  id: normalize(user.id) || normalize(cached?.id) || '',
});

export const hydrateUserFromCache = (user: User): User => {
  const cache = readCache();
  const idKey = keyForId(user.id);
  const emailKey = keyForEmail(user.email);

  const cachedById = idKey ? cache[idKey] : undefined;
  const cachedByEmail = emailKey ? cache[emailKey] : undefined;

  const cached = {
    ...(cachedByEmail || {}),
    ...(cachedById || {}),
  };

  return mergeUserWithCached(user, cached);
};

export const saveUserToCache = (user: User) => {
  const cache = readCache();
  const merged = mergeUserWithCached(user, cache[keyForId(user.id) || ''] || cache[keyForEmail(user.email) || '']);

  const idKey = keyForId(merged.id);
  const emailKey = keyForEmail(merged.email);

  if (idKey) {
    cache[idKey] = merged;
  }

  if (emailKey) {
    cache[emailKey] = merged;
  }

  writeCache(cache);
};
