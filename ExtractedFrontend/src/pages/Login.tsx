import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { UserRole } from '../types';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import {
    fetchProfileWithToken,
    getGoogleAuthStartUrl,
    resolvePostLoginRoute,
    setPostLoginRedirect,
} from '../services/auth';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
    const [oauthError, setOauthError] = React.useState<string | null>(null);
    const googleRedirectTriggered = React.useRef(false);

    const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const errorMessage = params.get('error') || params.get('message');
        if (errorMessage) {
            setOauthError(errorMessage);
        }
    }, [location.search]);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setOauthError(null);
        try {
            const response = await api.post('/auth/login', data);
            const { token, role } = response.data;

            // After login, fetch profile to get full user details
            const user = await fetchProfileWithToken(token);

            setAuth(user, token, role as UserRole);
            toast.success('Welcome back!');

            navigate(resolvePostLoginRoute(role, fromPath), { replace: true });
        } catch (error: any) {
            const message = error.response?.data?.message || 'Invalid credentials';
            toast.error(message);
            setOauthError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        if (isGoogleLoading || googleRedirectTriggered.current) return;

        googleRedirectTriggered.current = true;
        setOauthError(null);
        setIsGoogleLoading(true);

        const fallbackPath = resolvePostLoginRoute(undefined, fromPath);
        setPostLoginRedirect(fallbackPath);

        try {
            window.location.assign(getGoogleAuthStartUrl());
        } catch {
            setOauthError('Unable to start Google login. Please try again.');
            setIsGoogleLoading(false);
            googleRedirectTriggered.current = false;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-surface-950">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <Link
                to="/"
                className="absolute top-8 left-8 flex items-center space-x-2 text-surface-400 hover:text-white transition-colors group"
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>Back Home</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="glass-card p-8 space-y-8 bg-surface-900/40">
                    <div className="text-center space-y-2">
                        <div className="inline-flex bg-primary-600/10 p-3 rounded-2xl text-primary-500 mb-2">
                            <Car className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl font-bold">Welcome Back</h1>
                        <p className="text-surface-400">Enter your credentials to access your account</p>
                    </div>

                    {oauthError && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {oauthError}
                        </div>
                    )}

                    <div className="space-y-3">
                        <GoogleLoginButton
                            onClick={handleGoogleLogin}
                            loading={isGoogleLoading}
                            disabled={isLoading}
                        />
                        <p className="text-center text-xs text-surface-500">Use your Google account for quick access</p>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-surface-900/40 px-3 text-surface-500">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-surface-300">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="john@example.com"
                                    className="input-field pl-12"
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-surface-300">Password</label>
                                <a href="#" className="text-xs text-primary-500 hover:underline">Forgot?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                                <input
                                    {...register('password')}
                                    type="password"
                                    placeholder="••••••••"
                                    className="input-field pl-12"
                                />
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isGoogleLoading}
                            className="btn-primary w-full py-4 flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" />
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>
                    </form>

                    <footer className="text-center text-sm text-surface-400 pt-4">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-500 font-semibold hover:underline">
                            Create one now
                        </Link>
                    </footer>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
