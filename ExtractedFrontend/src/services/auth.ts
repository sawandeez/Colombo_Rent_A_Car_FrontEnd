import api from './api';
import type { User, UserRole } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const GOOGLE_AUTH_START_ENDPOINT = import.meta.env.VITE_GOOGLE_AUTH_START_ENDPOINT || '/auth/google';
const GOOGLE_AUTH_EXCHANGE_ENDPOINT = import.meta.env.VITE_GOOGLE_AUTH_EXCHANGE_ENDPOINT || '/auth/google/callback';

const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect';

export interface OAuthCallbackPayload {
    token?: string;
    role?: UserRole;
    error?: string;
    code?: string;
    state?: string;
}

interface OAuthExchangeResponse {
    token?: string;
    accessToken?: string;
    role?: UserRole | string;
    user?: User;
}

const normalizeRole = (role?: string | null): UserRole | undefined => {
    if (!role) return undefined;
    if (role === 'CUSTOMER' || role === 'ADMIN' || role === 'SPECIAL_ADMIN') return role;
    return undefined;
};

export const getGoogleAuthStartUrl = (): string => {
    const callbackUrl = `${window.location.origin}/auth/google/callback`;
    const url = new URL(`${API_BASE_URL}${GOOGLE_AUTH_START_ENDPOINT}`);
    url.searchParams.set('redirectUri', callbackUrl);
    return url.toString();
};

export const normalizeOAuthCallbackPayload = (search: string): OAuthCallbackPayload => {
    const params = new URLSearchParams(search);

    return {
        token: params.get('token') || params.get('accessToken') || params.get('jwt') || undefined,
        role: normalizeRole(params.get('role')),
        error: params.get('error') || params.get('message') || undefined,
        code: params.get('code') || undefined,
        state: params.get('state') || undefined,
    };
};

export const resolvePostLoginRoute = (role?: string, fallbackPath?: string): string => {
    if (fallbackPath && fallbackPath !== '/login' && fallbackPath !== '/auth/google/callback') {
        return fallbackPath;
    }
    if (role === 'ADMIN' || role === 'SPECIAL_ADMIN') return '/admin';
    return '/';
};

export const setPostLoginRedirect = (path: string) => {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, path);
};

export const consumePostLoginRedirect = (): string | null => {
    const value = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    if (value) sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    return value;
};

export const fetchProfileWithToken = async (token: string): Promise<User> => {
    const profileResponse = await api.get('/profile', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return profileResponse.data as User;
};

export const exchangeGoogleOAuthCode = async (code: string, state?: string): Promise<OAuthExchangeResponse> => {
    const response = await api.get(GOOGLE_AUTH_EXCHANGE_ENDPOINT, {
        params: {
            code,
            state,
        },
    });

    return response.data as OAuthExchangeResponse;
};
