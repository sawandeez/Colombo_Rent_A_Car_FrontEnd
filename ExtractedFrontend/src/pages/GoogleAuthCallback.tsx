import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import {
    consumePostLoginRedirect,
    exchangeGoogleOAuthCode,
    fetchProfileWithToken,
    normalizeOAuthCallbackPayload,
    resolvePostLoginRoute,
} from '../services/auth';
import type { UserRole } from '../types';

const GoogleAuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const setAuth = useAuthStore((state) => state.setAuth);

    React.useEffect(() => {
        let isMounted = true;

        const finishOAuth = async () => {
            const callbackPayload = normalizeOAuthCallbackPayload(location.search);

            if (callbackPayload.error) {
                navigate(`/login?error=${encodeURIComponent(callbackPayload.error)}`, { replace: true });
                return;
            }

            try {
                let token = callbackPayload.token;
                let role = callbackPayload.role;
                let user;

                if (!token && callbackPayload.code) {
                    const exchangeData = await exchangeGoogleOAuthCode(callbackPayload.code, callbackPayload.state);
                    token = exchangeData.token || exchangeData.accessToken;
                    role = (exchangeData.role as UserRole) || role;
                    user = exchangeData.user;
                }

                if (!token) {
                    throw new Error('Google authentication did not return a valid session token.');
                }

                if (!user) {
                    user = await fetchProfileWithToken(token);
                }

                const resolvedRole = role || user.role;
                if (!resolvedRole) {
                    throw new Error('Unable to resolve the authenticated user role.');
                }

                if (!isMounted) return;

                setAuth(user, token, resolvedRole);
                toast.success('Logged in with Google successfully.');

                const requestedPath = consumePostLoginRedirect() || undefined;
                navigate(resolvePostLoginRoute(resolvedRole, requestedPath), { replace: true });
            } catch (error: any) {
                const message = error?.response?.data?.message || error?.message || 'Google login failed. Please try again.';
                navigate(`/login?error=${encodeURIComponent(message)}`, { replace: true });
            }
        };

        finishOAuth();

        return () => {
            isMounted = false;
        };
    }, [location.search, navigate, setAuth]);

    return (
        <div className="min-h-screen bg-surface-950 text-white flex items-center justify-center p-6">
            <div className="glass-card bg-surface-900/40 p-8 rounded-2xl text-center max-w-md w-full">
                <div className="mx-auto h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                <h1 className="text-xl font-semibold">Completing Google sign-in</h1>
                <p className="text-surface-400 mt-2 text-sm">Please wait while we verify your account...</p>
            </div>
        </div>
    );
};

export default GoogleAuthCallback;
