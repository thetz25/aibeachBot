import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { carApi } from '../api/api';
import type { CarModel } from '../types/car';
import { Plus, Edit, Trash2 } from 'lucide-react';

export const CarList: React.FC = () => {
    const [cars, setCars] = useState<CarModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCars();
    }, []);

    const loadCars = async () => {
        try {
            const data = await carApi.getAll();
            setCars(data);
        } catch (error) {
            console.error('Failed to load cars', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this car?')) return;
        try {
            await carApi.delete(id);
            setCars(cars.filter(c => c.id !== id));
        } catch (error) {
            console.error('Failed to delete car', error);
            alert('Failed to delete');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Vehicle Inventory</h2>
                <Link to="/cars/new" className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-700 transition">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Vehicle
                </Link>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Image</th>
                            <th className="p-4 font-semibold text-gray-600">Model Name</th>
                            <th className="p-4 font-semibold text-gray-600">Type</th>
                            <th className="p-4 font-semibold text-gray-600">Price</th>
                            <th className="p-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cars.map(car => (
                            <tr key={car.id} className="border-b hover:bg-gray-50">
                                <td className="p-4">
                                    <img src={car.imageUrl} alt={car.name} className="w-16 h-10 object-cover rounded" />
                                </td>
                                <td className="p-4 font-medium text-gray-800">{car.name}</td>
                                <td className="p-4 text-gray-600">{car.type}</td>
                                <td className="p-4 font-mono text-gray-700">₱{car.price.toLocaleString()}</td>
                                <td className="p-4">
                                    <div className="flex space-x-2">
                                        <Link to={`/cars/${car.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button onClick={() => handleDelete(car.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {cars.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No cars found. Click "Add Vehicle" to start.
                    </div>
                )}
            </div>
        </div>
    );
};
