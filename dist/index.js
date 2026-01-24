"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const env_1 = require("./config/env");
const webhook_controller_1 = require("./controllers/webhook.controller");
const app = (0, express_1.default)();
// Parse application/x-www-form-urlencoded
app.use(body_parser_1.default.urlencoded({ extended: false }));
// Parse application/json
app.use(body_parser_1.default.json());
// Routes
app.get('/webhook', webhook_controller_1.verifyWebhook);
app.post('/webhook', webhook_controller_1.handleWebhook);
app.get('/', (req, res) => {
    res.send('🤖 AI Employee Chatbot is ALIVE and WAITING.');
});
// Start Server
app.listen(env_1.config.port, () => {
    console.log(`🚀 Server is running on port ${env_1.config.port}`);
    console.log(`🔍 Environment: Node ${process.version}`);
});
