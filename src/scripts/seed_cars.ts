import { CAR_MODELS } from '../config/cars.config';
import { carService } from '../services/car.service';

/**
 * Seed the database with initial car data
 */
async function seedCars() {
    console.log('🚀 Starting Seed Process...');

    for (const car of CAR_MODELS) {
        console.log(`Processing ${car.name}...`);

        // Check if exists
        const existing = await carService.getCarById(car.id);

        if (existing) {
            console.log(` - Model ${car.id} already exists. Updating...`);
            await carService.updateCar(car.id, car);
        } else {
            console.log(` - Creating new model ${car.id}...`);
            await carService.createCar(car);
        }
    }

    console.log('✅ Seeding Complete!');
}

seedCars().catch(console.error);
