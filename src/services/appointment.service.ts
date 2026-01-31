import { Appointment, AppointmentStatus, CustomerInfo } from '../types/appointment.types';
import { CAR_MODELS, CarModel, getCarById } from '../config/cars.config';
import { generateAppointmentId } from '../utils/date.utils';

// In-memory storage for appointments (replacing Google Sheets/Calendar)
const appointmentsStore: Map<string, Appointment> = new Map();

/**
 * Get list of all car models
 */
export const getCarModels = (): CarModel[] => {
    return CAR_MODELS;
};

/**
 * Check availability for a specific date and test drive (duration is fixed or based on car?)
 * Assuming uniform duration for test drives for now (e.g. 60 mins)
 */
export const checkAvailability = async (
    date: Date,
    carModel: CarModel
): Promise<Date[]> => {
    try {
        // Generate available slots (9 AM to 5 PM, hourly slots)
        const slots: Date[] = [];
        const startHour = 9;
        const endHour = 17;
        
        for (let hour = startHour; hour < endHour; hour++) {
            const slot = new Date(date);
            slot.setHours(hour, 0, 0, 0);
            
            // Check if slot is already booked
            const isBooked = Array.from(appointmentsStore.values()).some(apt => {
                if (apt.status !== AppointmentStatus.CONFIRMED) return false;
                const aptDate = new Date(apt.dateTime);
                return aptDate.getTime() === slot.getTime();
            });
            
            if (!isBooked) {
                slots.push(slot);
            }
        }
        
        return slots;
    } catch (error) {
        console.error('Failed to check availability:', error);
        return [];
    }
};

/**
 * Book a new Test Drive appointment
 */
export const bookAppointment = async (
    customerInfo: CustomerInfo,
    carModel: CarModel,
    dateTime: Date,
    notes?: string
): Promise<Appointment> => {
    // Create appointment object
    const appointment: Appointment = {
        id: generateAppointmentId(dateTime),
        carModel: carModel,
        dateTime,
        customer: customerInfo,
        status: AppointmentStatus.CONFIRMED,
        notes,
        createdAt: new Date()
    };

    try {
        // Store in memory (replaces Google Calendar and Sheets)
        appointmentsStore.set(appointment.id, appointment);
        
        console.log(`✅ Test Drive booked successfully: ${appointment.id}`);
        return appointment;
    } catch (error: any) {
        console.error('❌ Failed to book test drive:', error.message);
        throw new Error('Failed to book test drive. Please try again.');
    }
};

/**
 * Cancel an appointment
 */
export const cancelAppointment = async (
    appointmentId: string
): Promise<void> => {
    try {
        const appointment = appointmentsStore.get(appointmentId);
        if (appointment) {
            appointment.status = AppointmentStatus.CANCELLED;
            appointmentsStore.set(appointmentId, appointment);
        }

        console.log(`✅ Appointment cancelled: ${appointmentId}`);
    } catch (error: any) {
        console.error('❌ Failed to cancel appointment:', error.message);
        throw new Error('Failed to cancel appointment. Please try again.');
    }
};

/**
 * Reschedule an appointment
 */
export const rescheduleAppointment = async (
    appointmentId: string,
    newDateTime: Date,
    carModel: CarModel
): Promise<void> => {
    try {
        const appointment = appointmentsStore.get(appointmentId);
        if (appointment) {
            appointment.dateTime = newDateTime;
            appointmentsStore.set(appointmentId, appointment);
        }

        console.log(`✅ Appointment rescheduled: ${appointmentId}`);
    } catch (error: any) {
        console.error('❌ Failed to reschedule appointment:', error.message);
        throw new Error('Failed to reschedule appointment. Please try again.');
    }
};

/**
 * Get customer's appointments
 */
export const getCustomerAppointments = async (phone: string): Promise<any[]> => {
    try {
        const appointments = Array.from(appointmentsStore.values()).filter(apt => 
            apt.customer.phone === phone && apt.status === AppointmentStatus.CONFIRMED
        );
        return appointments;
    } catch (error) {
        console.error('Failed to get customer appointments:', error);
        return [];
    }
};

/**
 * Cancel appointment by ID
 */
export const cancelAppointmentById = async (appointmentId: string): Promise<void> => {
    const appointment = appointmentsStore.get(appointmentId);
    if (!appointment) {
        throw new Error(`Appointment ${appointmentId} not found.`);
    }

    await cancelAppointment(appointmentId);
};

/**
 * Reschedule appointment by ID
 */
export const rescheduleAppointmentById = async (
    appointmentId: string,
    newDateTime: Date
): Promise<void> => {
    const appointment = appointmentsStore.get(appointmentId);
    if (!appointment) {
        throw new Error(`Appointment ${appointmentId} not found.`);
    }

    const carModel = appointment.carModel || CAR_MODELS[0]; // Fallback

    await rescheduleAppointment(
        appointmentId,
        newDateTime,
        carModel
    );
};
