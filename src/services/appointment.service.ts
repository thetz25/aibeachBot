import { SiteVisit, SiteVisitStatus, LotService, CustomerInfo } from '../types/appointment.types';
import { DENTAL_SERVICES, getServiceById } from '../config/services.config';
import { generateAppointmentId } from '../utils/date.utils';
import * as calendarService from './google-calendar.service';
import * as sheetsService from './google-sheets.service';

/**
 * Get list of all lot services
 */
export const getLotServices = (): LotService[] => {
    return DENTAL_SERVICES;
};

/**
 * Check availability for a specific date and service
 */
export const checkAvailability = async (
    date: Date,
    service: LotService
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
 * Book a new site visit
 */
export const bookSiteVisit = async (
    customerInfo: CustomerInfo,
    service: LotService,
    dateTime: Date,
    notes?: string
): Promise<SiteVisit> => {
    // Create site visit object
    const siteVisit: SiteVisit = {
        id: generateAppointmentId(dateTime),
        service,
        dateTime,
        customer: customerInfo,
        status: SiteVisitStatus.CONFIRMED,
        notes,
        createdAt: new Date()
    };

    try {
        // Create calendar event
        const calendarEventId = await calendarService.createSiteVisit(siteVisit);
        siteVisit.calendarEventId = calendarEventId;

        // Save to Google Sheets
        await sheetsService.saveSiteVisit(siteVisit);

        console.log(`✅ Site visit booked successfully: ${siteVisit.id}`);
        return siteVisit;
    } catch (error: any) {
        console.error('❌ Failed to book site visit:', error.message);
        throw new Error('Failed to book site visit. Please try again.');
    }
};

/**
 * Cancel a site visit
 */
export const cancelSiteVisit = async (
    siteVisitId: string,
    calendarEventId?: string
): Promise<void> => {
    try {
        // Cancel in calendar
        if (calendarEventId) {
            await calendarService.cancelSiteVisit(calendarEventId);
        }

        // Update status in sheets
        await sheetsService.updateSiteVisitStatus(siteVisitId, SiteVisitStatus.CANCELLED);

        console.log(`✅ Site visit cancelled: ${siteVisitId}`);
    } catch (error: any) {
        console.error('❌ Failed to cancel site visit:', error.message);
        throw new Error('Failed to cancel site visit. Please try again.');
    }
};

/**
 * Reschedule a site visit
 */
export const rescheduleSiteVisit = async (
    siteVisitId: string,
    calendarEventId: string,
    newDateTime: Date,
    service: LotService
): Promise<void> => {
    try {
        // Update calendar event
        await calendarService.updateSiteVisit(calendarEventId, {
            dateTime: newDateTime,
            service
        } as any);

        console.log(`✅ Site visit rescheduled: ${siteVisitId}`);
    } catch (error: any) {
        console.error('❌ Failed to reschedule site visit:', error.message);
        throw new Error('Failed to reschedule site visit. Please try again.');
    }
};

/**
 * Get customer's site visits
 */
export const getCustomerSiteVisits = async (phone: string): Promise<any[]> => {
    try {
        const siteVisits = await sheetsService.getSiteVisitHistory(phone);
        return siteVisits.filter(apt => apt.status === SiteVisitStatus.CONFIRMED);
    } catch (error) {
        console.error('Failed to get customer site visits:', error);
        return [];
    }
};

/**
 * Mark site visit as completed
 */
export const completeSiteVisit = async (siteVisitId: string): Promise<void> => {
    try {
        await sheetsService.updateSiteVisitStatus(siteVisitId, SiteVisitStatus.COMPLETED);
        console.log(`✅ Site visit marked as completed: ${siteVisitId}`);
    } catch (error: any) {
        console.error('❌ Failed to complete site visit:', error.message);
    }
};

/**
 * Mark site visit as no-show
 */
export const markNoShow = async (siteVisitId: string): Promise<void> => {
    try {
        await sheetsService.updateSiteVisitStatus(siteVisitId, SiteVisitStatus.NO_SHOW);
        console.log(`✅ Site visit marked as no-show: ${siteVisitId}`);
    } catch (error: any) {
        console.error('❌ Failed to mark no-show:', error.message);
    }
};
