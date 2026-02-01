"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationStage = exports.AppointmentStatus = void 0;
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "PENDING";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["NO_SHOW"] = "NO_SHOW";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var ConversationStage;
(function (ConversationStage) {
    ConversationStage["INITIAL"] = "INITIAL";
    ConversationStage["CAR_SELECTION"] = "CAR_SELECTION";
    ConversationStage["DATE_SELECTION"] = "DATE_SELECTION";
    ConversationStage["TIME_SELECTION"] = "TIME_SELECTION";
    ConversationStage["CUSTOMER_NAME"] = "CUSTOMER_NAME";
    ConversationStage["CUSTOMER_PHONE"] = "CUSTOMER_PHONE";
    ConversationStage["CONFIRMATION"] = "CONFIRMATION";
    ConversationStage["COMPLETED"] = "COMPLETED";
})(ConversationStage || (exports.ConversationStage = ConversationStage = {}));
