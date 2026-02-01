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
// API Routes for Admin Panel
const car_controller_1 = require("./controllers/car.controller");
const apiRouter = express_1.default.Router();
apiRouter.get('/cars', car_controller_1.carController.getAll);
apiRouter.get('/cars/:id', car_controller_1.carController.getOne);
apiRouter.post('/cars', car_controller_1.carController.create);
apiRouter.put('/cars/:id', car_controller_1.carController.update);
apiRouter.delete('/cars/:id', car_controller_1.carController.delete);
// File Upload
const multer_1 = __importDefault(require("multer"));
const upload_controller_1 = require("./controllers/upload.controller");
const upload = (0, multer_1.default)({ dest: 'uploads/' });
apiRouter.post('/upload', upload.single('file'), upload_controller_1.uploadController.uploadFile);
app.use('/api', apiRouter);
app.get('/', (req, res) => {
    res.send('🤖 AI Employee Chatbot is ALIVE and WAITING.');
});
// Export the app for Vercel Serverless
exports.default = app;
// Only start the server if running locally (not imported as a module)
if (require.main === module) {
    app.listen(env_1.config.port, () => {
        console.log(`🚀 Server is running on port ${env_1.config.port}`);
        console.log(`🔍 Environment: Node ${process.version}`);
    });
}
