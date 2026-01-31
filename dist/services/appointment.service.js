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
exports.rescheduleAppointmentById = exports.cancelAppointmentById = exports.getCustomerAppointments = exports.rescheduleAppointment = exports.cancelAppointment = exports.bookAppointment = exports.checkAvailability = exports.getCarModels = void 0;
const appointment_types_1 = require("../types/appointment.types");
const cars_config_1 = require("../config/cars.config");
const date_utils_1 = require("../utils/date.utils");
const calendarService = __importStar(require("./google-calendar.service"));
const sheetsService = __importStar(require("./google-sheets.service"));
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
        // Default test drive duration 60 mins
        const duration = 60;
        const availableSlots = await calendarService.getAvailableSlots(date, duration);
        return availableSlots.map(slot => slot.start);
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
const bookAppointment = async (customerInfo, carModel, // Renamed from service
dateTime, notes) => {
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
        // Create calendar event
        const calendarEventId = await calendarService.createAppointment(appointment);
        appointment.calendarEventId = calendarEventId;
        // Save to Google Sheets
        await sheetsService.saveAppointment(appointment);
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
const rescheduleAppointment = async (appointmentId, calendarEventId, newDateTime, carModel) => {
    try {
        // Update calendar event
        await calendarService.updateAppointment(calendarEventId, {
            dateTime: newDateTime,
            service: carModel // Mapping carModel to 'service' expected by calendar wrapper if not updated
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
 * Cancel appointment by ID
 */
const cancelAppointmentById = async (appointmentId) => {
    const appointment = await sheetsService.getAppointmentById(appointmentId);
    if (!appointment) {
        throw new Error(`Appointment ${appointmentId} not found.`);
    }
    await (0, exports.cancelAppointment)(appointmentId, appointment.calendarEventId);
};
exports.cancelAppointmentById = cancelAppointmentById;
/**
 * Reschedule appointment by ID
 */
const rescheduleAppointmentById = async (appointmentId, newDateTime) => {
    const appointment = await sheetsService.getAppointmentById(appointmentId);
    if (!appointment) {
        throw new Error(`Appointment ${appointmentId} not found.`);
    }
    const carModel = (0, cars_config_1.getCarById)(appointment.serviceName) || cars_config_1.CAR_MODELS[0]; // Fallback
    await (0, exports.rescheduleAppointment)(appointmentId, appointment.calendarEventId, newDateTime, carModel);
};
exports.rescheduleAppointmentById = rescheduleAppointmentById;
