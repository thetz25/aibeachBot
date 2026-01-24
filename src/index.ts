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
