"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCarByName = exports.getCarById = exports.CAR_MODELS = void 0;
exports.CAR_MODELS = [
    {
        id: 'car_xpander_gls',
        name: 'Mitsubishi Xpander GLS',
        price: 1266000,
        dpPercent: 0.20,
        type: 'MPV',
        description: 'The reliable 7-seater MPV perfect for families, featuring a bold dynamic shield design.',
        imageUrl: 'https://placehold.co/600x400?text=Mitsubishi+Xpander',
        specs: {
            engine: '1.5L MIVEC DOHC 16-Valve',
            transmission: '4-Speed Automatic',
            seatingCapacity: 7,
            fuelType: 'Gasoline',
            power: '104 PS @ 6000 rpm',
            torque: '141 Nm @ 4000 rpm'
        }
    },
    {
        id: 'car_montero_gt',
        name: 'Mitsubishi Montero Sport GT v2',
        price: 2428000,
        dpPercent: 0.20,
        type: 'SUV',
        description: 'A premium SUV that combines power, luxury, and advanced safety features.',
        imageUrl: 'https://placehold.co/600x400?text=Montero+Sport',
        specs: {
            engine: '2.4L MIVEC Diesel',
            transmission: '8-Speed Automatic',
            seatingCapacity: 7,
            fuelType: 'Diesel',
            power: '181 PS @ 3500 rpm',
            torque: '430 Nm @ 2500 rpm'
        }
    },
    {
        id: 'car_mirage_g4',
        name: 'Mitsubishi Mirage G4 GLS',
        price: 934000,
        dpPercent: 0.20,
        type: 'Sedan',
        description: 'Practical, fuel-efficient, and stylish sedan for city driving.',
        imageUrl: 'https://placehold.co/600x400?text=Mirage+G4',
        specs: {
            engine: '1.2L MIVEC DOHC 12-Valve',
            transmission: 'CVT',
            seatingCapacity: 5,
            fuelType: 'Gasoline',
            power: '78 PS @ 6000 rpm',
            torque: '100 Nm @ 4000 rpm'
        }
    },
    {
        id: 'car_triton_athlete',
        name: 'Mitsubishi Triton Athlete 4WD',
        price: 1956000,
        dpPercent: 0.20,
        type: 'Pickup',
        description: 'Tough, durable, and ready for any adventure or heavy-duty task.',
        imageUrl: 'https://placehold.co/600x400?text=Triton+Athlete',
        specs: {
            engine: '2.4L Bi-Turbo Diesel',
            transmission: '6-Speed Automatic',
            seatingCapacity: 5,
            fuelType: 'Diesel',
            power: '204 PS @ 3500 rpm',
            torque: '470 Nm @ 1500-2750 rpm'
        }
    }
];
const getCarById = (id) => {
    return exports.CAR_MODELS.find(car => car.id === id);
};
exports.getCarById = getCarById;
const getCarByName = (name) => {
    return exports.CAR_MODELS.find(car => car.name.toLowerCase().includes(name.toLowerCase()));
};
exports.getCarByName = getCarByName;
