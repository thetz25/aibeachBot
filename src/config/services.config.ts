import { DentalService } from '../types/appointment.types';

export const DENTAL_SERVICES: DentalService[] = [
    {
        id: 'dental_001',
        name: 'General Consultation',
        duration: 30,
        price: 500,
        description: 'Comprehensive dental examination and consultation.'
    },
    {
        id: 'dental_002',
        name: 'Oral Prophylaxis (Cleaning)',
        duration: 45,
        price: 1500,
        description: 'Professional teeth cleaning to remove plaque and tartar.'
    },
    {
        id: 'dental_003',
        name: 'Tooth Extraction',
        duration: 60,
        price: 1000,
        description: 'Safe and painless removal of damaged or decayed teeth.'
    },
    {
        id: 'dental_004',
        name: 'Dental Fillings',
        duration: 60,
        price: 1200,
        description: 'Repairing cavities or minor damage with tooth-colored fillings.'
    },
    {
        id: 'dental_005',
        name: 'Braces Consultation',
        duration: 45,
        price: 800,
        description: 'Initial assessment for orthodontic treatment (braces).'
    }
];

export const getServiceById = (id: string): DentalService | undefined => {
    return DENTAL_SERVICES.find(service => service.id === id);
};

export const getServiceByName = (name: string): DentalService | undefined => {
    return DENTAL_SERVICES.find(
        service => service.name.toLowerCase() === name.toLowerCase()
    );
};
