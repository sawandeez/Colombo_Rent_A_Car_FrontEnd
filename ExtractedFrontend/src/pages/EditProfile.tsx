import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import 'react-phone-number-input/style.css';
import { ArrowLeft, Mail, MapPin, Save, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

type EditProfileForm = {
    name: string;
    email: string;
    phone: string;
    district: string;
    city: string;
};

const EditProfile: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuthStore();
    const [isSaving, setIsSaving] = React.useState(false);

    const { control, register, handleSubmit, formState: { errors }, reset } = useForm<EditProfileForm>({
        resolver: zodResolver(z.object({
            name: z.string().min(2, 'Full name is required'),
            email: z.string().email('Invalid email address'),
            phone: z.string().refine((value) => isValidPhoneNumber(value || ''), {
                message: 'Invalid international phone number',
            }),
            district: z.string().min(2, 'District is required'),
            city: z.string().min(2, 'City is required'),
        })),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            district: user?.district || '',
            city: user?.city || '',
        },
    });

    React.useEffect(() => {
        reset({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            district: user?.district || '',
            city: user?.city || '',
        });
    }, [reset, user]);

    const onSubmit = async (data: EditProfileForm) => {
        setIsSaving(true);

        try {
            const response = await api.put<User>('/profile', { ...data, phone: data.phone });
            updateUser(response.data);
            toast.success('Profile updated successfully');
            navigate('/profile');
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            toast.error(axiosError.response?.data?.message || 'Unable to update profile. Backend update endpoint may need to be enabled.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen pb-20 pt-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">Edit Profile</h1>
                        <p className="text-surface-400">Update your account details.</p>
                    </div>
                    <Link to="/profile" className="btn-outline !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="glass-card !bg-surface-900/40 space-y-6 leading-normal">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-surface-300">Full Name</label>
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                            <input
                                {...register('name', { required: 'Full name is required' })}
                                className="input-field pl-12"
                                placeholder="Your name"
                            />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-surface-300">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                            <input
                                {...register('email', { required: 'Email is required' })}
                                type="email"
                                className="input-field pl-12"
                                placeholder="name@example.com"
                            />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-surface-300">Phone</label>
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <PhoneInput
                                        {...field}
                                        international
                                        defaultCountry="LK"
                                        className="w-full max-w-sm phone-input"
                                        placeholder="Enter phone number"
                                    />
                                )}
                            />
                            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-surface-300">District</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                                <input
                                    {...register('district', { required: 'District is required' })}
                                    className="input-field pl-12"
                                    placeholder="Colombo"
                                />
                            </div>
                            {errors.district && <p className="text-red-500 text-xs">{errors.district.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-surface-300">City</label>
                        <input
                            {...register('city', { required: 'City is required' })}
                            className="input-field"
                            placeholder="City"
                        />
                        {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
