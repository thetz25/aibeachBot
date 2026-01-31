import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { carApi, uploadApi } from '../api/api';
import type { CarModel } from '../types/car';
import { Save, ArrowLeft } from 'lucide-react';

const INITIAL_STATE: CarModel = {
    id: '',
    name: '',
    price: 0,
    dpPercent: 0.20,
    type: 'SUV',
    description: '',
    imageUrl: '',
    specs: {
        engine: '',
        transmission: '',
        seatingCapacity: 5,
        fuelType: '',
        power: '',
        torque: ''
    }
};

export const CarForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState<CarModel>(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const isEdit = Boolean(id);

    useEffect(() => {
        if (id) {
            loadCar(id);
        }
    }, [id]);

    const loadCar = async (carId: string) => {
        try {
            setLoading(true);
            const data = await carApi.getOne(carId);
            setFormData(data);
        } catch (err) {
            setError('Failed to load car details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                setUploading(true);
                const url = await uploadApi.uploadImage(file);
                setFormData(prev => ({ ...prev, imageUrl: url }));
            } catch (err) {
                console.error('Upload failed', err);
                alert('Upload failed');
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isEdit) {
                await carApi.update(id!, formData);
            } else {
                if (!formData.id) formData.id = `car_${formData.name.toLowerCase().replace(/\s+/g, '_')}`;
                await carApi.create(formData);
            }
            navigate('/cars');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEdit && !formData.name) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={() => navigate('/cars')} className="flex items-center text-gray-500 hover:text-gray-800 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Inventory
            </button>

            <h1 className="text-3xl font-bold text-gray-800 mb-8">{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h1>

            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-8 border border-gray-100 space-y-8">
                {/* Basic Info */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {!isEdit && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID (Slug)</label>
                                <input name="id" value={formData.id} onChange={handleChange} placeholder="e.g. car_xpander" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
                                <p className="text-xs text-gray-400 mt-1">Unique identifier. Leave empty to auto-generate from name.</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                            <input required name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none">
                                <option>SUV</option>
                                <option>MPV</option>
                                <option>Sedan</option>
                                <option>Hatchback</option>
                                <option>Pickup</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (PHP)</label>
                            <input required type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Image</label>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="text"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                                />
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="image/*"
                                    />
                                    <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition">
                                        {uploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                            </div>
                            {formData.imageUrl && (
                                <img src={formData.imageUrl} alt="Preview" className="mt-2 h-32 object-cover rounded border" />
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea required name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
                        </div>
                    </div>
                </div>

                {/* Specs */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Engine</label>
                            <input required name="specs.engine" value={formData.specs.engine} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                            <input required name="specs.transmission" value={formData.specs.transmission} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Power</label>
                            <input required name="specs.power" value={formData.specs.power} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Torque</label>
                            <input required name="specs.torque" value={formData.specs.torque} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                            <input required name="specs.fuelType" value={formData.specs.fuelType} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
                            <input required type="number" name="specs.seatingCapacity" value={formData.specs.seatingCapacity} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={loading} className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center shadow-lg transform active:scale-95">
                        <Save className="w-5 h-5 mr-2" />
                        {loading ? 'Saving...' : 'Save Vehicle'}
                    </button>
                </div>
            </form>
        </div>
    );
};
