
import { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config/env';
import { savePageCredential } from '../services/db.service';

const FB_AUTH_URL = 'https://www.facebook.com/v22.0/dialog/oauth';
const FB_TOKEN_URL = 'https://graph.facebook.com/v22.0/oauth/access_token';
const FB_GRAPH_URL = 'https://graph.facebook.com/v22.0';

/**
 * 1. Redirect user to Facebook Login
 */
export const loginWithFacebook = (req: Request, res: Response) => {
    if (!config.facebook.appId) {
        return res.status(500).send("Misconfigured: Missing FACEBOOK_APP_ID");
    }

    const redirectUri = `${config.publicUrl}/auth/facebook/callback`;
    const scope = 'pages_show_list,pages_messaging,pages_read_engagement';

    // Construct the OAuth URL
    const url = `${FB_AUTH_URL}?client_id=${config.facebook.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;

    res.redirect(url);
};

/**
 * 2. Handle Callback, Exchange Code, and Save Page Tokens
 */
export const handleFacebookCallback = async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
        return res.status(400).send("Error: No code received from Facebook");
    }

    try {
        const redirectUri = `${config.publicUrl}/auth/facebook/callback`;

        // A. Exchange Code for User Access Token
        const tokenResp = await axios.get(FB_TOKEN_URL, {
            params: {
                client_id: config.facebook.appId,
                client_secret: config.facebook.appSecret,
                redirect_uri: redirectUri,
                code: code
            }
        });

        const userAccessToken = tokenResp.data.access_token;
        if (!userAccessToken) throw new Error("Failed to get User Access Token");

        // B. Get List of Pages and their Tokens (Accounts)
        // We request the 'access_token' field which gives us the Page Access Token directly
        const accountsResp = await axios.get(`${FB_GRAPH_URL}/me/accounts`, {
            params: {
                access_token: userAccessToken,
                fields: 'id,name,access_token'
            }
        });

        const pages = accountsResp.data.data;

        // C. Save each page token to DB
        let savedCount = 0;
        for (const page of pages) {
            await savePageCredential(page.id, page.name, page.access_token);
            savedCount++;
        }

        res.send(`
            <h1>✅ Connected Successfully!</h1>
            <p>Imported <strong>${savedCount}</strong> Facebook Pages.</p>
            <ul>
                ${pages.map((p: any) => `<li>${p.name} (ID: ${p.id})</li>`).join('')}
            </ul>
            <p>You can now close this window. The bot will automatically respond for these pages.</p>
        `);

    } catch (error: any) {
        console.error("❌ OAuth Error:", error.response?.data || error.message);
        res.status(500).send("Authentication Failed. Check logs.");
    }
};
