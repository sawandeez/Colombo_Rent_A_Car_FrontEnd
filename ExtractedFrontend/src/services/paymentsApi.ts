import api from './api';

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
