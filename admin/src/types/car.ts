export interface CarSpecs {
    engine: string;
    transmission: string;
    seatingCapacity: number;
    fuelType: string;
    power: string;
    torque: string;
}

export interface CarModel {
    id: string;
    name: string;
    price: number;
    dpPercent: number;
    type: 'SUV' | 'MPV' | 'Sedan' | 'Hatchback' | 'Pickup';
    description: string;
    imageUrl: string;
    specs: CarSpecs;
}
