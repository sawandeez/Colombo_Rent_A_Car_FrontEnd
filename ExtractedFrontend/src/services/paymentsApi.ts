import api from './api';

export const RECEIPT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const RECEIPT_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'] as const;
export const RECEIPT_ACCEPT_ATTRIBUTE = '.jpg,.jpeg,.png,.pdf,application/pdf,image/jpeg,image/png';
export const RECEIPT_INVALID_FILE_MESSAGE = 'Invalid file type. Please upload JPEG, JPG, PNG, or PDF.';

export type InitiatePaymentResponsePayHere = {
    gateway: 'PAYHERE';
    orderId: string;
    payhereUrl: string;
    fields: Record<string, string>;
};

export type InitiatePaymentResponseMock = {
    gateway: 'MOCK';
    orderId: string;
    redirectUrl: string;
};

export type InitiatePaymentResponse = InitiatePaymentResponsePayHere | InitiatePaymentResponseMock;

export type InitiatePaymentOptions = {
    returnUrl?: string;
    cancelUrl?: string;
};

export type UploadPaymentReceiptPayload = {
    bankName: string;
    bankBranch: string;
    amount: number;
    file: File;
};

export type PaymentReceiptUploadResponse = {
    id: string;
    bookingId: string;
    userId?: string;
    bankName: string;
    bankBranch: string;
    amount: number;
    fileName: string;
    contentType: string;
    uploadedAt: string;
};

const hasAllowedReceiptExtension = (fileName: string): boolean => {
    const normalizedName = fileName.toLowerCase();
    return RECEIPT_ALLOWED_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
};

export const isValidReceiptFile = (file: File): boolean => {
    if (!(file instanceof File)) return false;

    return RECEIPT_ALLOWED_MIME_TYPES.includes(file.type as (typeof RECEIPT_ALLOWED_MIME_TYPES)[number])
        || hasAllowedReceiptExtension(file.name);
};

export const initiatePayment = async (
    bookingId: string,
    options?: InitiatePaymentOptions,
): Promise<InitiatePaymentResponse> => {
    const payload = options
        ? {
            returnUrl: options.returnUrl,
            cancelUrl: options.cancelUrl,
        }
        : undefined;

    const response = await api.post<InitiatePaymentResponse>(`/bookings/${bookingId}/payments/initiate`, payload);
    return response.data;
};

export const uploadPaymentReceipt = async (
    bookingId: string,
    payload: UploadPaymentReceiptPayload,
): Promise<PaymentReceiptUploadResponse> => {
    if (!(payload.file instanceof File) || !isValidReceiptFile(payload.file)) {
        throw new Error(RECEIPT_INVALID_FILE_MESSAGE);
    }

    const formData = new FormData();
    formData.append('file', payload.file, payload.file.name);
    formData.append('bankName', payload.bankName.trim());
    formData.append('bankBranch', payload.bankBranch.trim());
    formData.append('amount', String(payload.amount));

    const response = await api.post<PaymentReceiptUploadResponse>(
        `/bookings/${bookingId}/payment-receipt`,
        formData,
        {
            headers: {},
            transformRequest: [(data) => data],
        },
    );

    return response.data;
};

export const submitHiddenForm = (actionUrl: string, fields: Record<string, string>) => {
    const form = document.createElement('form');
    form.method = 'post';
    form.action = actionUrl;
    form.style.display = 'none';

    Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    form.remove();
};

export const startPaymentCheckout = (response: InitiatePaymentResponse) => {
    if (response.gateway === 'PAYHERE') {
        if (!response.payhereUrl || !response.fields || Object.keys(response.fields).length === 0) {
            throw new Error('Invalid PayHere payment payload');
        }
        submitHiddenForm(response.payhereUrl, response.fields);
        return;
    }

    if (!response.redirectUrl) {
        throw new Error('Invalid mock payment payload');
    }

    window.location.assign(response.redirectUrl);
};
