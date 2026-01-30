export interface DentalService {
    id: string;
    name: string;
    duration: number; // in minutes
    price: number; // in PHP
    description?: string;
}

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
    service: DentalService;
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

export interface ConversationState {
    userId: string;
    stage: ConversationStage;
    data: {
        selectedService?: DentalService;
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
    SERVICE_SELECTION = 'SERVICE_SELECTION',
    DATE_SELECTION = 'DATE_SELECTION',
    TIME_SELECTION = 'TIME_SELECTION',
    CUSTOMER_NAME = 'CUSTOMER_NAME',
    CUSTOMER_PHONE = 'CUSTOMER_PHONE',
    CUSTOMER_EMAIL = 'CUSTOMER_EMAIL',
    CONFIRMATION = 'CONFIRMATION',
    COMPLETED = 'COMPLETED'
}
