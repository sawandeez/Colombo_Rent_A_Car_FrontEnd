import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, User, FileText, CreditCard, Eye,
    ChevronRight, ChevronLeft, Upload, AlertCircle, Car, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
    downloadMyDocument,
    DOCUMENT_PRIVACY_MESSAGE,
    listMyDocuments,
    uploadMyDocument,
    type MyDocumentCategory,
    type UserDocumentMetadata,
} from '../services/documents';
import type { User as AppUser, UserRole, Vehicle } from '../types';
import { formatPrice, cn } from '../utils';
import { useAuthStore } from '../store/authStore';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';

const steps = [
    { id: 1, name: 'Personal Details', icon: <User className="h-5 w-5" /> },
    { id: 2, name: 'Review', icon: <Eye className="h-5 w-5" /> },
    { id: 3, name: 'Documents', icon: <FileText className="h-5 w-5" /> },
    { id: 4, name: 'Payment', icon: <CreditCard className="h-5 w-5" /> },
];

const pickString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const getProfileSource = (payload: unknown): Record<string, unknown> | undefined => {
    if (!payload || typeof payload !== 'object') return undefined;
    const record = payload as Record<string, unknown>;

    if (record.user && typeof record.user === 'object') {
        return record.user as Record<string, unknown>;
    }

    if (record.data && typeof record.data === 'object') {
        return record.data as Record<string, unknown>;
    }

    return record;
};

const getFirstDefinedString = (source: Record<string, unknown> | undefined, keys: string[]): string | undefined => {
    if (!source) return undefined;
    for (const key of keys) {
        const value = pickString(source[key]);
        if (value) return value;
    }
    return undefined;
};

const toUserProfile = (payload: unknown, fallback: AppUser | null): AppUser | null => {
    const source = getProfileSource(payload);
    if (!source && !fallback) return null;

    const roleValue = getFirstDefinedString(source, ['role', 'userRole']) || fallback?.role || 'CUSTOMER';
    const role = (['CUSTOMER', 'ADMIN', 'SPECIAL_ADMIN'].includes(roleValue)
        ? roleValue
        : 'CUSTOMER') as UserRole;

    return {
        id: getFirstDefinedString(source, ['id', 'userId']) || fallback?.id || '',
        email: getFirstDefinedString(source, ['email']) || fallback?.email || '',
        name: getFirstDefinedString(source, ['name', 'fullName', 'username']) || fallback?.name || '',
        phone: getFirstDefinedString(source, ['phone', 'phoneNumber', 'mobile', 'mobileNumber', 'contactNumber']) || fallback?.phone || '',
        district: getFirstDefinedString(source, ['district', 'districtName']) || fallback?.district || '',
        city: getFirstDefinedString(source, ['city', 'cityName']) || fallback?.city || '',
        role,
        documentsVerified:
            typeof source?.documentsVerified === 'boolean'
                ? source.documentsVerified
                : typeof source?.isDocumentsVerified === 'boolean'
                    ? source.isDocumentsVerified
                    : fallback?.documentsVerified || false,
    };
};

// HIDDEN_CONCEPT:2OP-cmp
// HIDDEN_CONCEPT:SO-SRP
const BookingFlow: React.FC = () => {
    const [searchParams] = useSearchParams();
    const vehicleId = searchParams.get('vehicle');
    const navigate = useNavigate();
    const { user, updateUser } = useAuthStore();
    const [currentStep, setCurrentStep] = React.useState(1);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [nicFrontDocument, setNicFrontDocument] = React.useState<UserDocumentMetadata | null>(null);
    const [drivingLicenseDocument, setDrivingLicenseDocument] = React.useState<UserDocumentMetadata | null>(null);
    const [nicFrontLocalFile, setNicFrontLocalFile] = React.useState<File | null>(null);
    const [drivingLicenseLocalFile, setDrivingLicenseLocalFile] = React.useState<File | null>(null);
    const [nicFrontPreviewUrl, setNicFrontPreviewUrl] = React.useState<string | null>(null);
    const [drivingLicensePreviewUrl, setDrivingLicensePreviewUrl] = React.useState<string | null>(null);
    const [isUploadingNic, setIsUploadingNic] = React.useState(false);
    const [isUploadingLicense, setIsUploadingLicense] = React.useState(false);
    const [consentAccepted, setConsentAccepted] = React.useState(false);
    const [consentValidationMessage, setConsentValidationMessage] = React.useState<string | null>(null);
    const [uploadStatusMessage, setUploadStatusMessage] = React.useState<string | null>(null);
    const nicFrontInputRef = React.useRef<HTMLInputElement>(null);
    const drivingLicenseInputRef = React.useRef<HTMLInputElement>(null);
    const nicFrontObjectUrlRef = React.useRef<string | null>(null);
    const drivingLicenseObjectUrlRef = React.useRef<string | null>(null);

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

    // State for dates
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

    const calculateDays = () => {
        if (!dateRange?.from || !dateRange?.to) return 1; // Default minimum 1 day
        const start = dateRange.from.getTime();
        const end = dateRange.to.getTime();
        const diffTime = Math.max(0, end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
    };

    const totalDays = calculateDays();

    const { data: vehicle, isLoading } = useQuery<Vehicle>({
        queryKey: ['vehicle', vehicleId],
        queryFn: async () => {
            const response = await api.get(`/vehicles/${vehicleId}`);
            return response.data;
        },
        enabled: !!vehicleId,
    });

    const { data: profilePayload } = useQuery<unknown>({
        queryKey: ['profile'],
        queryFn: async () => {
            const response = await api.get('/profile');
            return response.data;
        },
        enabled: Boolean(user),
        staleTime: 5 * 60 * 1000,
    });

    const profileUser = React.useMemo(() => toUserProfile(profilePayload, user), [profilePayload, user]);

    React.useEffect(() => {
        if (!profileUser || !profileUser.id) return;

        if (
            user?.id !== profileUser.id ||
            user?.name !== profileUser.name ||
            user?.email !== profileUser.email ||
            user?.phone !== profileUser.phone ||
            user?.district !== profileUser.district ||
            user?.city !== profileUser.city ||
            user?.documentsVerified !== profileUser.documentsVerified ||
            user?.role !== profileUser.role
        ) {
            updateUser(profileUser);
        }
    }, [profileUser, updateUser, user]);

    const displayUser = profileUser || user;

    const { data: bookedDates = [] } = useQuery<string[]>({
        queryKey: ['vehicleBookedDates', vehicleId],
        queryFn: async () => {
            const response = await api.get(`/bookings/vehicle/${vehicleId}/booked-dates`);
            return response.data;
        },
        enabled: !!vehicleId,
    });

    const disabledDays = [
        { before: new Date() }, // Cannot book in the past
        ...bookedDates.map(dateStr => new Date(dateStr)) // Append already booked days
    ];

    const getErrorMessage = React.useCallback((error: unknown, fallback: string) => {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        const axiosError = error as AxiosError<{ message?: string }>;
        const status = axiosError?.response?.status;
        if (status === 401) return 'Please login';
        if (status === 403) return 'Access denied';
        if (status === 400) return axiosError?.response?.data?.message || fallback;
        return axiosError?.response?.data?.message || fallback;
    }, []);

    const setPreviewUrl = React.useCallback((category: MyDocumentCategory, nextUrl: string | null) => {
        if (category === 'NIC_FRONT') {
            if (nicFrontObjectUrlRef.current) {
                URL.revokeObjectURL(nicFrontObjectUrlRef.current);
            }
            nicFrontObjectUrlRef.current = nextUrl;
            setNicFrontPreviewUrl(nextUrl);
            return;
        }

        if (drivingLicenseObjectUrlRef.current) {
            URL.revokeObjectURL(drivingLicenseObjectUrlRef.current);
        }
        drivingLicenseObjectUrlRef.current = nextUrl;
        setDrivingLicensePreviewUrl(nextUrl);
    }, []);

    const resolvePreview = React.useCallback(async (document: UserDocumentMetadata) => {
        if (!document.contentType?.startsWith('image/')) {
            setPreviewUrl(document.category, null);
            return;
        }

        try {
            const blob = await downloadMyDocument(document.id);
            const objectUrl = URL.createObjectURL(blob);
            setPreviewUrl(document.category, objectUrl);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to load document preview'));
        }
    }, [getErrorMessage, setPreviewUrl]);

    const {
        data: myDocuments,
        error: myDocumentsError,
        refetch: refetchDocuments,
    } = useQuery<UserDocumentMetadata[]>({
        queryKey: ['my-documents'],
        queryFn: listMyDocuments,
    });

    React.useEffect(() => {
        if (!myDocuments) return;

        const nicDocument = myDocuments.find((doc) => doc.category === 'NIC_FRONT') || null;
        const licenseDocument = myDocuments.find((doc) => doc.category === 'DRIVING_LICENSE') || null;

        setNicFrontDocument(nicDocument);
        setDrivingLicenseDocument(licenseDocument);

        if (!nicDocument) setPreviewUrl('NIC_FRONT', null);
        if (!licenseDocument) setPreviewUrl('DRIVING_LICENSE', null);

        if (nicDocument) {
            void resolvePreview(nicDocument);
        }
        if (licenseDocument) {
            void resolvePreview(licenseDocument);
        }
    }, [myDocuments, resolvePreview, setPreviewUrl]);

    React.useEffect(() => {
        if (!myDocumentsError) return;
        toast.error(getErrorMessage(myDocumentsError, 'Failed to load documents'));
    }, [getErrorMessage, myDocumentsError]);

    React.useEffect(() => {
        return () => {
            if (nicFrontObjectUrlRef.current) {
                URL.revokeObjectURL(nicFrontObjectUrlRef.current);
            }
            if (drivingLicenseObjectUrlRef.current) {
                URL.revokeObjectURL(drivingLicenseObjectUrlRef.current);
            }
        };
    }, []);

    if (!vehicleId) {
        return (
            <div className="min-h-screen pt-40 text-center">
                <h1 className="text-2xl font-bold mb-4">No Vehicle Selected</h1>
                <Link to="/vehicles" className="btn-primary">Go to Fleet</Link>
            </div>
        );
    }

    if (isLoading) return <div className="min-h-screen pt-40 animate-pulse text-center">Loading booking details...</div>;

    const handleNext = () => {
        if (currentStep === 2 && (!dateRange?.from || !dateRange?.to)) {
            toast.error('Please select both pickup and return dates on the calendar.');
            return;
        }
        if (currentStep === 3) {
            if (!consentAccepted) {
                toast.error('Please accept the consent checkbox before continuing.');
                return;
            }
            if (!nicFrontDocument || !drivingLicenseDocument) {
                console.error('Both NIC Front and Driving License files are required before continuing.');
                return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
    };
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const validateFile = (file: File) => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            toast.error('Invalid file type. Please upload JPG, PNG, or PDF.');
            return false;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error('File exceeds 5MB limit.');
            return false;
        }

        return true;
    };

    const uploadDocument = async (file: File, category: MyDocumentCategory) => {
        if (category === 'NIC_FRONT') {
            setIsUploadingNic(true);
        } else {
            setIsUploadingLicense(true);
        }

        setUploadStatusMessage(`Uploading ${category === 'NIC_FRONT' ? 'NIC front' : 'driving license'}...`);

        try {
            const uploadedDocument = await uploadMyDocument(file, category, consentAccepted);
            if (category === 'NIC_FRONT') {
                setNicFrontDocument(uploadedDocument);
            } else {
                setDrivingLicenseDocument(uploadedDocument);
            }

            await resolvePreview(uploadedDocument);
            void refetchDocuments();
            setUploadStatusMessage(`${category === 'NIC_FRONT' ? 'NIC front' : 'Driving license'} uploaded successfully.`);
            toast.success('Document uploaded successfully');
        } catch (error) {
            setUploadStatusMessage(null);
            toast.error(getErrorMessage(error, 'Document upload failed'));
        } finally {
            if (category === 'NIC_FRONT') {
                setIsUploadingNic(false);
            } else {
                setIsUploadingLicense(false);
            }
        }
    };

    const ensureConsentBeforeUpload = () => {
        if (consentAccepted) return true;
        const message = 'Please accept consent before uploading documents.';
        setConsentValidationMessage(message);
        setUploadStatusMessage(null);
        toast.error(message);
        return false;
    };

    const handleFileSelection = (
        file: File | null,
        category: MyDocumentCategory,
    ) => {
        if (!file) return;
        if (!ensureConsentBeforeUpload()) return;
        if (!validateFile(file)) return;

        if (category === 'NIC_FRONT') {
            setNicFrontLocalFile(file);
        } else {
            setDrivingLicenseLocalFile(file);
        }

        if (file.type.startsWith('image/')) {
            const localPreviewUrl = URL.createObjectURL(file);
            setPreviewUrl(category, localPreviewUrl);
        } else {
            setPreviewUrl(category, null);
        }

        void uploadDocument(file, category);
    };

    const handleFileInputChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        category: MyDocumentCategory,
    ) => {
        const file = event.target.files?.[0] || null;
        handleFileSelection(file, category);
        event.target.value = '';
    };

    const handleDrop = (
        event: React.DragEvent<HTMLDivElement>,
        category: MyDocumentCategory,
    ) => {
        event.preventDefault();
        if (!ensureConsentBeforeUpload()) return;
        const file = event.dataTransfer.files?.[0] || null;
        handleFileSelection(file, category);
    };

    const handleSelectFileClick = (category: MyDocumentCategory) => {
        if (!ensureConsentBeforeUpload()) return;
        if (category === 'NIC_FRONT') {
            nicFrontInputRef.current?.click();
            return;
        }
        drivingLicenseInputRef.current?.click();
    };

    const handleViewDocument = async (document: UserDocumentMetadata) => {
        try {
            const blob = await downloadMyDocument(document.id);
            const objectUrl = URL.createObjectURL(blob);
            window.open(objectUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Unable to open document'));
        }
    };

    const handleSubmit = async () => {
        if (!nicFrontDocument || !drivingLicenseDocument) {
            console.error('Both NIC Front and Driving License files are required before submitting.');
            return;
        }

        setIsSubmitting(true);
        try {
            const estimatedAdvanceAmount = Math.round((vehicle?.rentalPricePerDay ?? 0) * totalDays * 0.25);
            await api.post('/bookings', {
                vehicleId,
                startDate: dateRange?.from?.toISOString(),
                endDate: dateRange?.to?.toISOString(),
                estimatedAdvanceAmount,
            });
            toast.success('Booking requested successfully!');
            navigate('/profile');
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Booking failed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen pb-20 pt-10">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                {/* Progress Stepper */}
                <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-800 -translate-y-1/2" />
                    <div
                        className="absolute top-1/2 left-0 h-0.5 bg-primary-600 -translate-y-1/2 transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />
                    <div className="relative flex justify-between">
                        {steps.map((step) => (
                            <div key={step.id} className="flex flex-col items-center group">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 z-10",
                                    currentStep >= step.id
                                        ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/30"
                                        : "bg-surface-950 border-surface-800 text-surface-500"
                                )}>
                                    {currentStep > step.id ? <Check className="h-6 w-6" /> : step.icon}
                                </div>
                                <span className={cn(
                                    "mt-3 text-xs font-bold uppercase tracking-wider transition-colors",
                                    currentStep >= step.id ? "text-white" : "text-surface-600"
                                )}>
                                    {step.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <h2 className="text-3xl font-bold">Personal Details</h2>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/profile/edit')}
                                            className="btn-outline !py-2 !px-4 text-xs font-bold"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <p className="text-surface-400">Confirm your details before proceeding with the reservation.</p>
                                    <div className="glass-card grid grid-cols-2 gap-6 !bg-surface-900/30 leading-normal">
                                        <div className="space-y-1 text-left">
                                            <div className="text-xs text-surface-500 uppercase tracking-widest font-bold">Full Name</div>
                                            <div className="text-white font-medium">{displayUser?.name || '-'}</div>
                                        </div>
                                        <div className="space-y-1 text-left">
                                            <div className="text-xs text-surface-500 uppercase tracking-widest font-bold">District</div>
                                            <div className="text-white font-medium">{displayUser?.district || '-'}</div>
                                        </div>
                                        <div className="space-y-1 text-left">
                                            <div className="text-xs text-surface-500 uppercase tracking-widest font-bold">Email</div>
                                            <div className="text-white font-medium">{displayUser?.email || '-'}</div>
                                        </div>
                                        <div className="space-y-1 text-left">
                                            <div className="text-xs text-surface-500 uppercase tracking-widest font-bold">Phone</div>
                                            <div className="text-white font-medium">{displayUser?.phone || '-'}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h2 className="text-3xl font-bold">Review Your Reservation</h2>
                                    <p className="text-surface-400">Select your travel dates and review vehicle details.</p>
                                    <div className="glass-card space-y-6 !bg-surface-900/30 leading-normal">
                                        <div className="flex items-center space-x-4">
                                            <img src={vehicle?.imageUrls?.[0] || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800"} className="w-24 h-16 rounded-xl object-cover" />
                                            <div className="text-left">
                                                <h4 className="font-bold">{vehicle?.make} {vehicle?.model}</h4>
                                                <p className="text-xs text-surface-500">{vehicle?.type}</p>
                                            </div>
                                        </div>
                                        <hr className="border-white/5" />
                                        <div className="flex flex-col items-center py-4 text-white">
                                            <style>{`
                                                .rdp-root {
                                                    --rdp-accent-color: var(--color-primary-500, #ec4899);
                                                    --rdp-background-color: var(--color-surface-800, #1f2937);
                                                    --rdp-outline: 2px solid var(--color-primary-500, #ec4899);
                                                    --rdp-outline-selected: 2px solid var(--rdp-accent-color);
                                                }
                                                .rdp-day_selected {
                                                    color: white !important;
                                                    font-weight: bold;
                                                }
                                                .rdp-day_disabled {
                                                    opacity: 1 !important;
                                                    color: #ef4444 !important;
                                                    background-color: rgba(239, 68, 68, 0.1) !important;
                                                    text-decoration: line-through;
                                                }
                                            `}</style>
                                            <p className="text-sm text-surface-400 mb-6 font-medium bg-red-500/10 text-red-400 px-4 py-2 rounded-full inline-block border border-red-500/20">
                                                Red dates are already booked
                                            </p>
                                            <div className="bg-surface-900/50 p-4 rounded-3xl border border-white/5 shadow-2xl overflow-hidden self-center max-w-full overflow-x-auto custom-scrollbar">
                                                <DayPicker
                                                    mode="range"
                                                    selected={dateRange}
                                                    onSelect={setDateRange}
                                                    disabled={disabledDays}
                                                    numberOfMonths={window.innerWidth > 768 ? 2 : 1}
                                                    pagedNavigation
                                                />
                                            </div>
                                            {(dateRange?.from && !dateRange?.to) && (
                                                <p className="mt-4 text-xs font-bold text-orange-400 animate-pulse uppercase tracking-widest">
                                                    Select a Return Date
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h2 className="text-3xl font-bold">Document Verification</h2>
                                    <p className="text-surface-400">We require a clear photo of your Driving License and NIC.</p>

                                    <div className="glass-card !bg-surface-900/30 space-y-4 leading-normal">
                                        <p className="text-sm text-surface-300">
                                            <span className="font-bold text-primary-400">Privacy Notice:</span> {DOCUMENT_PRIVACY_MESSAGE}.
                                        </p>
                                        <label className="flex items-start gap-3 cursor-pointer text-sm text-surface-200">
                                            <input
                                                type="checkbox"
                                                checked={consentAccepted}
                                                onChange={(event) => {
                                                    const isChecked = event.target.checked;
                                                    setConsentAccepted(isChecked);
                                                    if (isChecked) {
                                                        setConsentValidationMessage(null);
                                                    }
                                                }}
                                                className="mt-1 h-4 w-4 rounded border-white/20 bg-surface-900 text-primary-500 focus:ring-primary-500"
                                            />
                                            <span>I understand and consent to temporary document storage for verification.</span>
                                        </label>
                                        {consentValidationMessage && (
                                            <p className="text-xs text-red-400">{consentValidationMessage}</p>
                                        )}
                                        {uploadStatusMessage && (
                                            <p className="text-xs text-emerald-400">{uploadStatusMessage}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <input
                                            ref={nicFrontInputRef}
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            className="hidden"
                                            disabled={!consentAccepted}
                                            onChange={(e) => handleFileInputChange(e, 'NIC_FRONT')}
                                        />
                                        <div
                                            className={cn(
                                                "glass-card border-dashed border-2 border-white/10 flex flex-col items-center justify-center p-12 space-y-4 transition-colors group leading-normal",
                                                consentAccepted ? "hover:border-primary-500/50 cursor-pointer" : "opacity-70 cursor-not-allowed"
                                            )}
                                            onClick={() => handleSelectFileClick('NIC_FRONT')}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, 'NIC_FRONT')}
                                        >
                                            {nicFrontPreviewUrl ? (
                                                <img src={nicFrontPreviewUrl} className="h-20 w-full max-w-[180px] object-cover rounded-lg border border-white/10" />
                                            ) : (
                                                <Upload className="h-10 w-10 text-surface-600 group-hover:text-primary-500 transition-colors" />
                                            )}
                                            <div className="text-sm font-bold">Upload NIC Front</div>
                                            {nicFrontLocalFile?.type === 'application/pdf' && !nicFrontPreviewUrl && (
                                                <div className="text-[11px] text-surface-400 text-center">PDF selected</div>
                                            )}
                                            {nicFrontDocument && (
                                                <div className="text-[11px] text-surface-400 text-center">
                                                    Uploaded: {nicFrontDocument.originalFilename}
                                                </div>
                                            )}
                                            {!nicFrontDocument && nicFrontLocalFile && (
                                                <div className="text-[11px] text-surface-400 text-center">
                                                    Selected: {nicFrontLocalFile.name}
                                                </div>
                                            )}
                                            {nicFrontDocument && (
                                                <div className="text-[10px] text-emerald-400 uppercase tracking-widest">Status: Uploaded</div>
                                            )}
                                            {nicFrontDocument?.createdAt && (
                                                <div className="text-[10px] text-surface-500">
                                                    {new Date(nicFrontDocument.createdAt).toLocaleString()}
                                                </div>
                                            )}
                                            {nicFrontDocument && (
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        className="text-xs font-bold text-primary-400 hover:underline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void handleViewDocument(nicFrontDocument);
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-xs font-bold text-surface-300 hover:underline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            nicFrontInputRef.current?.click();
                                                        }}
                                                    >
                                                        Replace
                                                    </button>
                                                </div>
                                            )}
                                            {isUploadingNic && (
                                                <div className="text-[10px] text-surface-500 uppercase tracking-widest">Uploading...</div>
                                            )}
                                            <button
                                                type="button"
                                                disabled={!consentAccepted || isUploadingNic}
                                                className="btn-outline !py-2 !px-4 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectFileClick('NIC_FRONT');
                                                }}
                                            >
                                                Upload NIC Front
                                            </button>
                                            <div className="text-xs text-surface-500">JPG, PNG up to 5MB</div>
                                        </div>
                                        <input
                                            ref={drivingLicenseInputRef}
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            className="hidden"
                                            disabled={!consentAccepted}
                                            onChange={(e) => handleFileInputChange(e, 'DRIVING_LICENSE')}
                                        />
                                        <div
                                            className={cn(
                                                "glass-card border-dashed border-2 border-white/10 flex flex-col items-center justify-center p-12 space-y-4 transition-colors group leading-normal",
                                                consentAccepted ? "hover:border-primary-500/50 cursor-pointer" : "opacity-70 cursor-not-allowed"
                                            )}
                                            onClick={() => handleSelectFileClick('DRIVING_LICENSE')}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, 'DRIVING_LICENSE')}
                                        >
                                            {drivingLicensePreviewUrl ? (
                                                <img src={drivingLicensePreviewUrl} className="h-20 w-full max-w-[180px] object-cover rounded-lg border border-white/10" />
                                            ) : (
                                                <Upload className="h-10 w-10 text-surface-600 group-hover:text-primary-500 transition-colors" />
                                            )}
                                            <div className="text-sm font-bold">Upload Driving License</div>
                                            {drivingLicenseLocalFile?.type === 'application/pdf' && !drivingLicensePreviewUrl && (
                                                <div className="text-[11px] text-surface-400 text-center">PDF selected</div>
                                            )}
                                            {drivingLicenseDocument && (
                                                <div className="text-[11px] text-surface-400 text-center">
                                                    Uploaded: {drivingLicenseDocument.originalFilename}
                                                </div>
                                            )}
                                            {!drivingLicenseDocument && drivingLicenseLocalFile && (
                                                <div className="text-[11px] text-surface-400 text-center">
                                                    Selected: {drivingLicenseLocalFile.name}
                                                </div>
                                            )}
                                            {drivingLicenseDocument && (
                                                <div className="text-[10px] text-emerald-400 uppercase tracking-widest">Status: Uploaded</div>
                                            )}
                                            {drivingLicenseDocument?.createdAt && (
                                                <div className="text-[10px] text-surface-500">
                                                    {new Date(drivingLicenseDocument.createdAt).toLocaleString()}
                                                </div>
                                            )}
                                            {drivingLicenseDocument && (
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        className="text-xs font-bold text-primary-400 hover:underline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void handleViewDocument(drivingLicenseDocument);
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-xs font-bold text-surface-300 hover:underline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            drivingLicenseInputRef.current?.click();
                                                        }}
                                                    >
                                                        Replace
                                                    </button>
                                                </div>
                                            )}
                                            {isUploadingLicense && (
                                                <div className="text-[10px] text-surface-500 uppercase tracking-widest">Uploading...</div>
                                            )}
                                            <button
                                                type="button"
                                                disabled={!consentAccepted || isUploadingLicense}
                                                className="btn-outline !py-2 !px-4 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectFileClick('DRIVING_LICENSE');
                                                }}
                                            >
                                                Upload Driving License
                                            </button>
                                            <div className="text-xs text-surface-500">JPG, PNG up to 5MB</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="text-center space-y-4">
                                        <div className="inline-flex bg-emerald-500/10 p-5 rounded-3xl text-emerald-500 mb-4">
                                            <Shield className="h-12 w-12" />
                                        </div>
                                        <h2 className="text-3xl font-bold">Ready to Confirm</h2>
                                        <p className="text-surface-400 max-w-sm mx-auto">
                                            Once you submit, our admin will review your documents. After approval, you'll need to pay the advance amount.
                                        </p>
                                    </div>

                                    <div className="glass-card !bg-primary-600/10 border-primary-500/20 p-6 flex items-start space-x-4 leading-normal">
                                        <AlertCircle className="h-6 w-6 text-primary-400 shrink-0" />
                                        <p className="text-sm text-primary-400 text-left">
                                            Total Rental: <strong>{formatPrice(vehicle?.rentalPricePerDay ? vehicle.rentalPricePerDay * totalDays : 0)}</strong>.
                                            Required Advance (25%): <strong>{formatPrice(vehicle?.rentalPricePerDay ? vehicle.rentalPricePerDay * totalDays * 0.25 : 0)}</strong>.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Controls */}
                        <div className="flex justify-between items-center pt-8">
                            <button
                                onClick={handleBack}
                                className={cn("btn-outline flex items-center space-x-2", currentStep === 1 && "invisible")}
                            >
                                <ChevronLeft className="h-5 w-5" />
                                <span>Back</span>
                            </button>

                            {currentStep < steps.length ? (
                                <button
                                    onClick={handleNext}
                                    disabled={currentStep === 3 && !consentAccepted}
                                    className={cn(
                                        "btn-primary flex items-center space-x-2",
                                        currentStep === 3 && !consentAccepted && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <span>Continue</span>
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="btn-primary flex items-center space-x-2 !bg-emerald-600 hover:bg-emerald-500"
                                >
                                    {isSubmitting ? 'Processing...' : 'Confirm Reservation'}
                                    <Check className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="space-y-6">
                        <div className="glass-card !p-0 overflow-hidden leading-normal">
                            <div className="p-6 bg-surface-900/50 flex items-center space-x-3">
                                <Car className="h-5 w-5 text-primary-500" />
                                <span className="font-bold">Reservation Summary</span>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-surface-500">Daily Rate</span>
                                    <span className="text-white font-medium">{formatPrice(vehicle?.rentalPricePerDay || 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-surface-500">Duration</span>
                                    <span className="text-white font-medium">{totalDays} Day{totalDays > 1 ? 's' : ''}</span>
                                </div>
                                <hr className="border-white/5" />
                                <div className="flex justify-between items-end">
                                    <span className="text-surface-400 font-bold uppercase text-[10px] tracking-widest">Estimated Total</span>
                                    <span className="text-2xl font-bold text-primary-400">
                                        {formatPrice(vehicle?.rentalPricePerDay ? vehicle.rentalPricePerDay * totalDays : 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card !p-6 flex items-start space-x-3 !bg-blue-500/5 border-blue-500/10 leading-normal">
                            <Check className="h-5 w-5 text-blue-500 shrink-0" />
                            <div>
                                <h5 className="text-xs font-bold text-blue-400 uppercase mb-1 text-left">Secure Booking</h5>
                                <p className="text-[10px] text-blue-400/70 leading-relaxed text-left">
                                    Your data is encrypted and secure. Documents are only used for verification purposes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingFlow;
