import { LotService } from '../types/appointment.types';

export const DENTAL_SERVICES: LotService[] = [
    {
        id: 'lot_a1',
        name: 'Site Visit (Francisco, San Mateo)',
        duration: 60,
        price: 0,
        description: '200sqm, ₱1,800/sqm, TCP ₱360k'
    },
    {
        id: 'lot_a2',
        name: 'Site Visit (Policarpio, Bigte)',
        duration: 60,
        price: 0,
        description: '200sqm, ₱2,500/sqm, TCP ₱500k'
    },
    {
        id: 'lot_a3',
        name: 'Site Visit (Pascual Farm, San Mateo)',
        duration: 60,
        price: 0,
        description: '250sqm, ₱2,800/sqm, TCP ₱700k'
    },
    {
        id: 'lot_a4',
        name: 'Site Visit (Vergara, Sta. Maria)',
        duration: 60,
        price: 0,
        description: '100sqm, ₱8,000/sqm, TCP ₱800k'
    }
];

export const getServiceById = (id: string): LotService | undefined => {
    return DENTAL_SERVICES.find(service => service.id === id);
};

export const getServiceByName = (name: string): LotService | undefined => {
    return DENTAL_SERVICES.find(
        service => service.name.toLowerCase() === name.toLowerCase()
    );
};
