"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carService = void 0;
const db_service_1 = require("./db.service");
const TABLE_NAME = 'cars';
exports.carService = {
    /**
     * Get all cars
     */
    async getAllCars() {
        const { data, error } = await db_service_1.supabase
            .from(TABLE_NAME)
            .select('*')
            .order('price', { ascending: true });
        if (error)
            throw error;
        return data;
    },
    /**
     * Get car by ID
     */
    async getCarById(id) {
        const { data, error } = await db_service_1.supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            return null;
        return data;
    },
    /**
     * Create a new car
     */
    async createCar(car) {
        const { data, error } = await db_service_1.supabase
            .from(TABLE_NAME)
            .insert([car])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    /**
     * Update a car
     */
    async updateCar(id, updates) {
        const { data, error } = await db_service_1.supabase
            .from(TABLE_NAME)
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    /**
     * Delete a car
     */
    async deleteCar(id) {
        const { error } = await db_service_1.supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
};
