import { Appointment, AppointmentStatus, CustomerInfo } from '../types/appointment.types';
import { CAR_MODELS, CarModel, getCarById } from '../config/cars.config';
import { generateAppointmentId } from '../utils/date.utils';
import * as calendarService from './google-calendar.service';
import * as sheetsService from './google-sheets.service';

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
        // Default test drive duration 60 mins
        const duration = 60;
        const availableSlots = await calendarService.getAvailableSlots(date, duration);
        return availableSlots.map(slot => slot.start);
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
    carModel: CarModel, // Renamed from service
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
        // Create calendar event
        const calendarEventId = await calendarService.createAppointment(appointment);
        appointment.calendarEventId = calendarEventId;

        // Save to Google Sheets
        await sheetsService.saveAppointment(appointment);

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
    appointmentId: string,
    calendarEventId?: string
): Promise<void> => {
    try {
        // Cancel in calendar
        if (calendarEventId) {
            await calendarService.cancelAppointment(calendarEventId);
        }

        // Update status in sheets
        await sheetsService.updateAppointmentStatus(appointmentId, AppointmentStatus.CANCELLED);

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
    calendarEventId: string,
    newDateTime: Date,
    carModel: CarModel
): Promise<void> => {
    try {
        // Update calendar event
        await calendarService.updateAppointment(calendarEventId, {
            dateTime: newDateTime,
            service: carModel // Mapping carModel to 'service' expected by calendar wrapper if not updated
        } as any);

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
        const appointments = await sheetsService.getAppointmentHistory(phone);
        return appointments.filter((apt: any) => apt.status === AppointmentStatus.CONFIRMED);
    } catch (error) {
        console.error('Failed to get customer appointments:', error);
        return [];
    }
};

/**
 * Cancel appointment by ID
 */
export const cancelAppointmentById = async (appointmentId: string): Promise<void> => {
    const appointment = await sheetsService.getAppointmentById(appointmentId);
    if (!appointment) {
        throw new Error(`Appointment ${appointmentId} not found.`);
    }

    await cancelAppointment(appointmentId, appointment.calendarEventId);
};

/**
 * Reschedule appointment by ID
 */
export const rescheduleAppointmentById = async (
    appointmentId: string,
    newDateTime: Date
): Promise<void> => {
    const appointment = await sheetsService.getAppointmentById(appointmentId);
    if (!appointment) {
        throw new Error(`Appointment ${appointmentId} not found.`);
    }

    const carModel = getCarById(appointment.serviceName) || CAR_MODELS[0]; // Fallback

    await rescheduleAppointment(
        appointmentId,
        appointment.calendarEventId,
        newDateTime,
        carModel
    );
};
