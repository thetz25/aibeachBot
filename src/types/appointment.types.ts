import { CarModel } from '../config/cars.config';

export interface TimeSlot {
    start: Date;
    end: Date;
    available: boolean;
}

export interface CustomerInfo {
    name: string;
    phone: string;
    email?: string;
    facebookUserId: string;
}

export interface Appointment {
    id: string;
    carModel: CarModel; // Replaces 'service'
    dateTime: Date;
    customer: CustomerInfo;
    status: AppointmentStatus;
    calendarEventId?: string;
    notes?: string;
    createdAt: Date;
}

export enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    NO_SHOW = 'NO_SHOW'
}

// Keeping ConversationState generic enough, though mostly handled by AI now
export interface ConversationState {
    userId: string;
    stage: ConversationStage;
    data: {
        selectedCarId?: string;
        selectedDate?: string;
        selectedTime?: string;
        customerName?: string;
        customerPhone?: string;
        customerEmail?: string;
    };
    lastUpdated: Date;
}

export enum ConversationStage {
    INITIAL = 'INITIAL',
    CAR_SELECTION = 'CAR_SELECTION',
    DATE_SELECTION = 'DATE_SELECTION',
    TIME_SELECTION = 'TIME_SELECTION',
    CUSTOMER_NAME = 'CUSTOMER_NAME',
    CUSTOMER_PHONE = 'CUSTOMER_PHONE',
    CONFIRMATION = 'CONFIRMATION',
    COMPLETED = 'COMPLETED'
}
