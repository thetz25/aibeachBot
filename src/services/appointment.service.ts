import { Appointment, AppointmentStatus, DentalService, CustomerInfo } from '../types/appointment.types';
import { DENTAL_SERVICES, getServiceById } from '../config/services.config';
import { generateAppointmentId } from '../utils/date.utils';
import * as calendarService from './google-calendar.service';
import * as sheetsService from './google-sheets.service';

/**
 * Get list of all dental services
 */
export const getDentalServices = (): DentalService[] => {
    return DENTAL_SERVICES;
};

/**
 * Check availability for a specific date and service
 */
export const checkAvailability = async (
    date: Date,
    service: DentalService
): Promise<Date[]> => {
    try {
        const availableSlots = await calendarService.getAvailableSlots(date, service.duration);
        return availableSlots.map(slot => slot.start);
    } catch (error) {
        console.error('Failed to check availability:', error);
        return [];
    }
};

/**
 * Book a new dental appointment
 */
export const bookAppointment = async (
    customerInfo: CustomerInfo,
    service: DentalService,
    dateTime: Date,
    notes?: string
): Promise<Appointment> => {
    // Create appointment object
    const appointment: Appointment = {
        id: generateAppointmentId(dateTime),
        service,
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

        console.log(`✅ Appointment booked successfully: ${appointment.id}`);
        return appointment;
    } catch (error: any) {
        console.error('❌ Failed to book appointment:', error.message);
        throw new Error('Failed to book appointment. Please try again.');
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
    service: DentalService
): Promise<void> => {
    try {
        // Update calendar event
        await calendarService.updateAppointment(calendarEventId, {
            dateTime: newDateTime,
            service
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
 * Mark appointment as completed
 */
export const completeAppointment = async (appointmentId: string): Promise<void> => {
    try {
        await sheetsService.updateAppointmentStatus(appointmentId, AppointmentStatus.COMPLETED);
        console.log(`✅ Appointment marked as completed: ${appointmentId}`);
    } catch (error: any) {
        console.error('❌ Failed to complete appointment:', error.message);
    }
};

/**
 * Mark appointment as no-show
 */
export const markNoShow = async (appointmentId: string): Promise<void> => {
    try {
        await sheetsService.updateAppointmentStatus(appointmentId, AppointmentStatus.NO_SHOW);
        console.log(`✅ Appointment marked as no-show: ${appointmentId}`);
    } catch (error: any) {
        console.error('❌ Failed to mark no-show:', error.message);
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

    const service = getServiceById(appointment.serviceName) || DENTAL_SERVICES[0]; // Fallback if name mapping fails

    await rescheduleAppointment(
        appointmentId,
        appointment.calendarEventId,
        newDateTime,
        service
    );
};
