import express from 'express';
import bodyParser from 'body-parser';
import { config } from './config/env';
import { verifyWebhook, handleWebhook } from './controllers/webhook.controller';
import { loginWithFacebook, handleFacebookCallback } from './controllers/auth.controller';

const app = express();

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// Parse application/json
app.use(bodyParser.json());

// Webhook Routes
app.get('/webhook', verifyWebhook);
app.post('/webhook', handleWebhook);

// Auth Routes
app.get('/auth/facebook', loginWithFacebook);
app.get('/auth/facebook/callback', handleFacebookCallback);

// Landing Page
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>🤖 AI Employee Bot</h1>
            <p>Status: <strong>ONLINE</strong></p>
            <hr style="max-width: 300px; margin: 20px auto;">
            <p>Need to connect a new Facebook Page?</p>
            <a href="/auth/facebook" style="background-color: #1877F2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Login with Facebook
            </a>
        </div>
    `);
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
