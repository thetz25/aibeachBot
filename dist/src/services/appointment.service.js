"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescheduleAppointmentById = exports.cancelAppointmentById = exports.getCustomerAppointments = exports.rescheduleAppointment = exports.cancelAppointment = exports.bookAppointment = exports.checkAvailability = exports.getCarModels = void 0;
const appointment_types_1 = require("../types/appointment.types");
const cars_config_1 = require("../config/cars.config");
const date_utils_1 = require("../utils/date.utils");
// In-memory storage for appointments (replacing Google Sheets/Calendar)
const appointmentsStore = new Map();
/**
 * Get list of all car models
 */
const getCarModels = () => {
    return cars_config_1.CAR_MODELS;
};
exports.getCarModels = getCarModels;
/**
 * Check availability for a specific date and test drive (duration is fixed or based on car?)
 * Assuming uniform duration for test drives for now (e.g. 60 mins)
 */
const checkAvailability = async (date, carModel) => {
    try {
        // Generate available slots (9 AM to 5 PM, hourly slots)
        const slots = [];
        const startHour = 9;
        const endHour = 17;
        for (let hour = startHour; hour < endHour; hour++) {
            const slot = new Date(date);
            slot.setHours(hour, 0, 0, 0);
            // Check if slot is already booked
            const isBooked = Array.from(appointmentsStore.values()).some(apt => {
                if (apt.status !== appointment_types_1.AppointmentStatus.CONFIRMED)
                    return false;
                const aptDate = new Date(apt.dateTime);
                return aptDate.getTime() === slot.getTime();
            });
            if (!isBooked) {
                slots.push(slot);
            }
        }
        return slots;
    }
    catch (error) {
        console.error('Failed to check availability:', error);
        return [];
    }
};
exports.checkAvailability = checkAvailability;
/**
 * Book a new Test Drive appointment
 */
const bookAppointment = async (customerInfo, carModel, dateTime, notes) => {
    // Create appointment object
    const appointment = {
        id: (0, date_utils_1.generateAppointmentId)(dateTime),
        carModel: carModel,
        dateTime,
        customer: customerInfo,
        status: appointment_types_1.AppointmentStatus.CONFIRMED,
        notes,
        createdAt: new Date()
    };
    try {
        // Store in memory (replaces Google Calendar and Sheets)
        appointmentsStore.set(appointment.id, appointment);
        console.log(`✅ Test Drive booked successfully: ${appointment.id}`);
        return appointment;
    }
    catch (error) {
        console.error('❌ Failed to book test drive:', error.message);
        throw new Error('Failed to book test drive. Please try again.');
    }
};
exports.bookAppointment = bookAppointment;
/**
 * Cancel an appointment
 */
const cancelAppointment = async (appointmentId) => {
    try {
        const appointment = appointmentsStore.get(appointmentId);
        if (appointment) {
            appointment.status = appointment_types_1.AppointmentStatus.CANCELLED;
            appointmentsStore.set(appointmentId, appointment);
        }
        console.log(`✅ Appointment cancelled: ${appointmentId}`);
    }
    catch (error) {
        console.error('❌ Failed to cancel appointment:', error.message);
        throw new Error('Failed to cancel appointment. Please try again.');
    }
};
exports.cancelAppointment = cancelAppointment;
/**
 * Reschedule an appointment
 */
const rescheduleAppointment = async (appointmentId, newDateTime, carModel) => {
    try {
        const appointment = appointmentsStore.get(appointmentId);
        if (appointment) {
            appointment.dateTime = newDateTime;
            appointmentsStore.set(appointmentId, appointment);
        }
        console.log(`✅ Appointment rescheduled: ${appointmentId}`);
    }
    catch (error) {
        console.error('❌ Failed to reschedule appointment:', error.message);
        throw new Error('Failed to reschedule appointment. Please try again.');
    }
};
exports.rescheduleAppointment = rescheduleAppointment;
/**
 * Get customer's appointments
 */
const getCustomerAppointments = async (phone) => {
    try {
        const appointments = Array.from(appointmentsStore.values()).filter(apt => apt.customer.phone === phone && apt.status === appointment_types_1.AppointmentStatus.CONFIRMED);
        return appointments;
    }
    catch (error) {
        console.error('Failed to get customer appointments:', error);
        return [];
    }
};
exports.getCustomerAppointments = getCustomerAppointments;
/**
 * Cancel appointment by ID
 */
const cancelAppointmentById = async (appointmentId) => {
    const appointment = appointmentsStore.get(appointmentId);
    if (!appointment) {
        throw new Error(`Appointment ${appointmentId} not found.`);
    }
    await (0, exports.cancelAppointment)(appointmentId);
};
exports.cancelAppointmentById = cancelAppointmentById;
/**
 * Reschedule appointment by ID
 */
const rescheduleAppointmentById = async (appointmentId, newDateTime) => {
    const appointment = appointmentsStore.get(appointmentId);
    if (!appointment) {
        throw new Error(`Appointment ${appointmentId} not found.`);
    }
    const carModel = appointment.carModel || cars_config_1.CAR_MODELS[0]; // Fallback
    await (0, exports.rescheduleAppointment)(appointmentId, newDateTime, carModel);
};
exports.rescheduleAppointmentById = rescheduleAppointmentById;
