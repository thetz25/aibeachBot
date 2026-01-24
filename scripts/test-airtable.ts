import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Airtable from 'airtable';

const run = async () => {
    console.log("🔍 Testing Airtable Connection...");
    console.log("   API Key present:", !!process.env.AIRTABLE_API_KEY);
    console.log("   Base ID present:", !!process.env.AIRTABLE_BASE_ID);
    console.log("   Table Name:", process.env.AIRTABLE_TABLE_NAME || 'Messages');

    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        console.error("❌ CRTICAL: Missing Credentials in .env");
        return;
    }

    try {
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
        const table = base(process.env.AIRTABLE_TABLE_NAME || 'Messages');

        console.log("🚀 Attempting to create a test record...");
        const records = await table.create([
            {
                fields: {
                    UserId: 'test-user-debug',
                    Role: 'user',
                    Content: 'This is a debug message from test-airtable.ts'
                }
            }
        ]);

        console.log("✅ Success! Record created with ID:", records[0].id);

        console.log("🗑️ Cleaning up test record...");
        await table.destroy([records[0].id]);
        console.log("✅ Custom Cleanup Complete.");

    } catch (error: any) {
        console.error("❌ Failed to connect or write to Airtable:");
        console.error("   Error Type:", error.name);
        console.error("   Message:", error.message);
        if (error.statusCode === 404) {
            console.error("   HINT: Check if Base ID is correct and Table Name matches EXACTLY (Case Sensitive).");
        } else if (error.statusCode === 401 || error.statusCode === 403) {
            console.error("   HINT: Check if API Key is correct and has 'data.records:write' scope.");
        } else if (error.message.includes('Field')) {
            console.error("   HINT: Check if your columns (UserId, Role, Content) exist and are spelled correctly.");
        }
    }
};

run();
