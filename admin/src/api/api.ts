import axios from 'axios';
import type { CarModel } from '../types/car';

// Default to localhost:3000 if not specified
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
});

export const uploadApi = {
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<{ url: string }>('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.url;
    }
};

export const carApi = {
    getAll: async () => {
        const response = await api.get<CarModel[]>('/cars');
        return response.data;
    },
    getOne: async (id: string) => {
        const response = await api.get<CarModel>(`/cars/${id}`);
        return response.data;
    },
    create: async (car: CarModel) => {
        const response = await api.post<CarModel>('/cars', car);
        return response.data;
    },
    update: async (id: string, car: Partial<CarModel>) => {
        const response = await api.put<CarModel>(`/cars/${id}`, car);
        return response.data;
    },
    delete: async (id: string) => {
        await api.delete(`/cars/${id}`);
    }
};
