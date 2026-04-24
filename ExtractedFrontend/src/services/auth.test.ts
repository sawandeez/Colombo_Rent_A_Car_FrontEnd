import { describe, expect, it } from 'vitest';
import { normalizeOAuthCallbackPayload, resolvePostLoginRoute } from './auth';

describe('auth service', () => {
    it('parses a successful OAuth callback payload', () => {
        const payload = normalizeOAuthCallbackPayload('?token=abc123&role=CUSTOMER');

        expect(payload.token).toBe('abc123');
        expect(payload.role).toBe('CUSTOMER');
        expect(payload.error).toBeUndefined();
    });

    it('parses an OAuth failure callback payload', () => {
        const payload = normalizeOAuthCallbackPayload('?error=access_denied');

        expect(payload.error).toBe('access_denied');
        expect(payload.token).toBeUndefined();
    });

    it('resolves protected redirect target when available', () => {
        const route = resolvePostLoginRoute('CUSTOMER', '/profile');
        expect(route).toBe('/profile');
    });

    it('resolves admin fallback route', () => {
        const route = resolvePostLoginRoute('ADMIN');
        expect(route).toBe('/admin');
    });
});
