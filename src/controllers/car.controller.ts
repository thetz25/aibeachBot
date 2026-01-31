import { Request, Response } from 'express';
import { carService } from '../services/car.service';

export const carController = {
    // GET /api/cars
    async getAll(req: Request, res: Response) {
        try {
            const cars = await carService.getAllCars();
            res.json(cars);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // GET /api/cars/:id
    async getOne(req: Request, res: Response) {
        try {
            const car = await carService.getCarById(req.params.id as string);
            if (!car) return res.status(404).json({ error: 'Car not found' });
            res.json(car);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // POST /api/cars
    async create(req: Request, res: Response) {
        try {
            const car = await carService.createCar(req.body);
            res.status(201).json(car);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    // PUT /api/cars/:id
    async update(req: Request, res: Response) {
        try {
            const car = await carService.updateCar(req.params.id as string, req.body);
            res.json(car);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    // DELETE /api/cars/:id
    async delete(req: Request, res: Response) {
        try {
            await carService.deleteCar(req.params.id as string);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
