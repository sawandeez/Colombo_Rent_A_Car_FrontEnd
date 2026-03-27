import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, MapPin, UserPlus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    age: z.number().int('Age must be a valid number').min(25, 'You must be at least 25 years old'),
    phone: z.string().refine((value) => isValidPhoneNumber(value || ''), {
        message: 'Enter a valid phone number with country code',
    }),
    district: z.literal('Colombo'),
    city: z.string().min(2, 'City is required'),
    address: z.string().min(5, 'Address is required'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = React.useState(false);

    const { register, control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            district: 'Colombo',
            phone: '',
            age: 25,
            city: '',
            address: '',
        }
    });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        try {
            await api.post('/auth/register', {
                ...data,
                district: 'Colombo',
                city: `${data.address}, ${data.city}`,
            });
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-surface-950 py-20">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <Link
                to="/"
                className="absolute top-8 left-8 flex items-center space-x-2 text-surface-400 hover:text-white transition-colors group z-50"
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>Back Home</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
            >
                <div className="glass-card p-8 md:p-12 space-y-8 bg-surface-900/40">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold">Join Colombo Rent A Car</h1>
                        <p className="text-surface-400">Experience premium mobility. Register in seconds.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="text-sm font-medium text-surface-300">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                                <input {...register('name')} placeholder="John Doe" className="input-field pl-12" />
                            </div>
                            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-surface-300">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                                <input {...register('email')} type="email" placeholder="john@example.com" className="input-field pl-12" />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-surface-300">Phone Number</label>
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <PhoneInput
                                        {...field}
                                        international
                                        defaultCountry="LK"
                                        countryCallingCodeEditable={false}
                                        className="phone-input"
                                        placeholder="Enter phone number"
                                    />
                                )}
                            />
                            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                        </div>

                        {/* Age */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-surface-300">Age</label>
                            <input
                                type="number"
                                min={25}
                                {...register('age', { valueAsNumber: true })}
                                className="input-field"
                                placeholder="Enter your age"
                            />
                            <p className="text-xs text-surface-400">You must be at least 25 years old to request a vehicle.</p>
                            {errors.age && <p className="text-red-500 text-xs">{errors.age.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="text-sm font-medium text-surface-300">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                                <input {...register('password')} type="password" placeholder="••••••••" className="input-field pl-12" />
                            </div>
                            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                        </div>

                        {/* Address */}
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="text-sm font-medium text-surface-300">Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                                <input {...register('address')} placeholder="123 Main St" className="input-field pl-12" />
                            </div>
                            {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                        </div>

                        {/* City */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-surface-300">City</label>
                            <input {...register('city')} placeholder="Colombo" className="input-field" />
                            {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
                        </div>

                        {/* District hardcoded to Colombo */}
                        <input type="hidden" value="Colombo" {...register('district')} />
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-surface-300">District</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                                <input value="Colombo" readOnly className="input-field pl-12 bg-white/5 opacity-80 cursor-not-allowed" />
                            </div>
                            {errors.district && <p className="text-red-500 text-xs">{errors.district.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary md:col-span-2 py-4 flex items-center justify-center space-x-2 mt-4"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="h-5 w-5" />
                                    <span>Create Account</span>
                                </>
                            )}
                        </button>
                    </form>

                    <footer className="text-center text-sm text-surface-400 pt-4">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-500 font-semibold hover:underline">
                            Log in instead
                        </Link>
                    </footer>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
