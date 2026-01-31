"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carController = void 0;
const car_service_1 = require("../services/car.service");
exports.carController = {
    // GET /api/cars
    async getAll(req, res) {
        try {
            const cars = await car_service_1.carService.getAllCars();
            res.json(cars);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    // GET /api/cars/:id
    async getOne(req, res) {
        try {
            const car = await car_service_1.carService.getCarById(req.params.id);
            if (!car)
                return res.status(404).json({ error: 'Car not found' });
            res.json(car);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    // POST /api/cars
    async create(req, res) {
        try {
            const car = await car_service_1.carService.createCar(req.body);
            res.status(201).json(car);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    // PUT /api/cars/:id
    async update(req, res) {
        try {
            const car = await car_service_1.carService.updateCar(req.params.id, req.body);
            res.json(car);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    // DELETE /api/cars/:id
    async delete(req, res) {
        try {
            await car_service_1.carService.deleteCar(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};
