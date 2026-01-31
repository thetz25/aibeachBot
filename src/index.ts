import express from 'express';
import bodyParser from 'body-parser';
import { config } from './config/env';
import { verifyWebhook, handleWebhook } from './controllers/webhook.controller';

const app = express();

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// Parse application/json
app.use(bodyParser.json());

// Routes
app.get('/webhook', verifyWebhook);
app.post('/webhook', handleWebhook);

// API Routes for Admin Panel
import { carController } from './controllers/car.controller';
const apiRouter = express.Router();
apiRouter.get('/cars', carController.getAll);
apiRouter.get('/cars/:id', carController.getOne);
apiRouter.post('/cars', carController.create);
apiRouter.put('/cars/:id', carController.update);
apiRouter.delete('/cars/:id', carController.delete);

// File Upload
import multer from 'multer';
import { uploadController } from './controllers/upload.controller';

const upload = multer({ dest: 'uploads/' });
apiRouter.post('/upload', upload.single('file'), uploadController.uploadFile);

app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.send('🤖 AI Employee Chatbot is ALIVE and WAITING.');
});

// Export the app for Vercel Serverless
export default app;

// Only start the server if running locally (not imported as a module)
if (require.main === module) {
    app.listen(config.port, () => {
        console.log(`🚀 Server is running on port ${config.port}`);
        console.log(`🔍 Environment: Node ${process.version}`);
    });
}
