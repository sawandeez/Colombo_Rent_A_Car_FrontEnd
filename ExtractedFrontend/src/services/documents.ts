import api from './api';

export type MyDocumentCategory = 'NIC_FRONT' | 'DRIVING_LICENSE';
const ALLOWED_DOCUMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const DOCUMENT_RETENTION_HOURS = 48;
export const DOCUMENT_PRIVACY_MESSAGE = `Documents will be deleted after ${DOCUMENT_RETENTION_HOURS} hours`;

export interface UserDocumentMetadata {
  id: string;
  category: MyDocumentCategory;
  originalFilename: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export const uploadMyDocument = async (
  file: File,
  category: MyDocumentCategory,
  consentAccepted: boolean
): Promise<UserDocumentMetadata> => {
  if (!(file instanceof File)) {
    throw new Error('Invalid file payload. Please choose a file again.');
  }

  if (category !== 'NIC_FRONT' && category !== 'DRIVING_LICENSE') {
    throw new Error('Invalid document category.');
  }

  if (!consentAccepted) {
    throw new Error('Consent is required before uploading documents.');
  }

  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPG, PNG, or PDF.');
  }

  const formData = new FormData();
  // IMPORTANT: must be exactly "file" and "category"
  formData.append('file', file, file.name);
  formData.append('category', category);
  formData.append('consentAccepted', String(consentAccepted));

  if (import.meta.env.DEV) {
    const entries: Array<{ key: string; valueType: string }> = [];
    formData.forEach((value, key) => {
      entries.push({ key, valueType: value instanceof File ? `File(${value.type})` : typeof value });
    });
    console.debug('[documents] uploadMyDocument FormData entries', entries);
  }

  const response = await api.post<UserDocumentMetadata>('/users/me/documents', formData, {
    // DO NOT set Content-Type. Keep headers empty so nothing overrides it.
    headers: {},
    // Prevent axios from trying to transform FormData
    transformRequest: [(data) => data],
  });

  return response.data;
};

export const listMyDocuments = async (): Promise<UserDocumentMetadata[]> => {
  const response = await api.get<UserDocumentMetadata[]>('/users/me/documents');
  return response.data;
};

export const downloadMyDocument = async (documentId: string): Promise<Blob> => {
  const response = await api.get<Blob>(`/users/me/documents/${documentId}`, {
    responseType: 'blob',
  });
  return response.data;
};