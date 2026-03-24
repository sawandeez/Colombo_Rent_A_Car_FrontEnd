import api from './api';

export type MyDocumentCategory = 'NIC_FRONT' | 'DRIVING_LICENSE';

export interface UserDocumentDTO {
    id?: string;
    category: MyDocumentCategory;
    fileName?: string;
    uploadedAt?: string;
    status?: string;
}

export const uploadMyDocument = async (file: File, category: MyDocumentCategory): Promise<UserDocumentDTO> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await api.post<UserDocumentDTO>('/users/me/documents', formData);
    return response.data;
};

export const listMyDocuments = async (): Promise<UserDocumentDTO[]> => {
    const response = await api.get<UserDocumentDTO[]>('/users/me/documents');
    return response.data;
};
