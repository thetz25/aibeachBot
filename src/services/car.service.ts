import { supabase } from './db.service';
import { CarModel } from '../config/cars.config';

const TABLE_NAME = 'cars';

export const carService = {
    /**
     * Get all cars
     */
    async getAllCars(): Promise<CarModel[]> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;
        return data as CarModel[];
    },

    /**
     * Get car by ID
     */
    async getCarById(id: string): Promise<CarModel | null> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data as CarModel;
    },

    /**
     * Create a new car
     */
    async createCar(car: CarModel): Promise<CarModel> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([car])
            .select()
            .single();

        if (error) throw error;
        return data as CarModel;
    },

    /**
     * Update a car
     */
    async updateCar(id: string, updates: Partial<CarModel>): Promise<CarModel> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as CarModel;
    },

    /**
     * Delete a car
     */
    async deleteCar(id: string): Promise<void> {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
