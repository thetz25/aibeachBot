"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNoShow = exports.completeAppointment = exports.getCustomerAppointments = exports.rescheduleAppointment = exports.cancelAppointment = exports.bookAppointment = exports.checkAvailability = exports.getDentalServices = void 0;
const appointment_types_1 = require("../types/appointment.types");
const services_config_1 = require("../config/services.config");
const date_utils_1 = require("../utils/date.utils");
const calendarService = __importStar(require("./google-calendar.service"));
const sheetsService = __importStar(require("./google-sheets.service"));
/**
 * Get list of all dental services
 */
const getDentalServices = () => {
    return services_config_1.DENTAL_SERVICES;
};
exports.getDentalServices = getDentalServices;
/**
 * Check availability for a specific date and service
 */
const checkAvailability = async (date, service) => {
    try {
        const availableSlots = await calendarService.getAvailableSlots(date, service.duration);
        return availableSlots.map(slot => slot.start);
    }
    catch (error) {
        console.error('Failed to check availability:', error);
        return [];
    }
};
exports.checkAvailability = checkAvailability;
/**
 * Book a new dental appointment
 */
const bookAppointment = async (customerInfo, service, dateTime, notes) => {
    // Create appointment object
    const appointment = {
        id: (0, date_utils_1.generateAppointmentId)(dateTime),
        service,
        dateTime,
        customer: customerInfo,
        status: appointment_types_1.AppointmentStatus.CONFIRMED,
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
    }
    catch (error) {
        console.error('❌ Failed to book appointment:', error.message);
        throw new Error('Failed to book appointment. Please try again.');
    }
};
exports.bookAppointment = bookAppointment;
/**
 * Cancel an appointment
 */
const cancelAppointment = async (appointmentId, calendarEventId) => {
    try {
        // Cancel in calendar
        if (calendarEventId) {
            await calendarService.cancelAppointment(calendarEventId);
        }
        // Update status in sheets
        await sheetsService.updateAppointmentStatus(appointmentId, appointment_types_1.AppointmentStatus.CANCELLED);
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
const rescheduleAppointment = async (appointmentId, calendarEventId, newDateTime, service) => {
    try {
        // Update calendar event
        await calendarService.updateAppointment(calendarEventId, {
            dateTime: newDateTime,
            service
        });
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
        const appointments = await sheetsService.getAppointmentHistory(phone);
        return appointments.filter((apt) => apt.status === appointment_types_1.AppointmentStatus.CONFIRMED);
    }
    catch (error) {
        console.error('Failed to get customer appointments:', error);
        return [];
    }
};
exports.getCustomerAppointments = getCustomerAppointments;
/**
 * Mark appointment as completed
 */
const completeAppointment = async (appointmentId) => {
    try {
        await sheetsService.updateAppointmentStatus(appointmentId, appointment_types_1.AppointmentStatus.COMPLETED);
        console.log(`✅ Appointment marked as completed: ${appointmentId}`);
    }
    catch (error) {
        console.error('❌ Failed to complete appointment:', error.message);
    }
};
exports.completeAppointment = completeAppointment;
/**
 * Mark appointment as no-show
 */
const markNoShow = async (appointmentId) => {
    try {
        await sheetsService.updateAppointmentStatus(appointmentId, appointment_types_1.AppointmentStatus.NO_SHOW);
        console.log(`✅ Appointment marked as no-show: ${appointmentId}`);
    }
    catch (error) {
        console.error('❌ Failed to mark no-show:', error.message);
    }
};
exports.markNoShow = markNoShow;
