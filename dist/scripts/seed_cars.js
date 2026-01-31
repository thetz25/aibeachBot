"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cars_config_1 = require("../config/cars.config");
const car_service_1 = require("../services/car.service");
/**
 * Seed the database with initial car data
 */
async function seedCars() {
    console.log('🚀 Starting Seed Process...');
    for (const car of cars_config_1.CAR_MODELS) {
        console.log(`Processing ${car.name}...`);
        // Check if exists
        const existing = await car_service_1.carService.getCarById(car.id);
        if (existing) {
            console.log(` - Model ${car.id} already exists. Updating...`);
            await car_service_1.carService.updateCar(car.id, car);
        }
        else {
            console.log(` - Creating new model ${car.id}...`);
            await car_service_1.carService.createCar(car);
        }
    }
    console.log('✅ Seeding Complete!');
}
seedCars().catch(console.error);
