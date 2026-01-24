import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Airtable from 'airtable';

const run = async () => {
    console.log("🔍 Testing Airtable Connection...");
    console.log("   API Key present:", !!process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_API_KEY.startsWith('pat'));
    console.log("   Base ID present:", !!process.env.AIRTABLE_BASE_ID);
    console.log("   Table Name:", process.env.AIRTABLE_TABLE_NAME || 'Messages');

    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        console.error("❌ CRTICAL: Missing Credentials in .env");
        return;
    }

    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const table = base(process.env.AIRTABLE_TABLE_NAME || 'Messages');

    // 1. Test READ Access
    console.log("\n📡 Phase 1: Testing READ Access...");
    try {
        const reads = await table.select({ maxRecords: 1 }).firstPage();
        console.log(`✅ READ Success! Found ${reads.length} records.`);
    } catch (error: any) {
        console.error("❌ READ Failed:");
        console.error("   Message:", error.message);
        if (error.statusCode === 404) {
            console.error("   → Check BASE ID and TABLE NAME.");
        } else if (error.statusCode === 401 || error.statusCode === 403) {
            console.error("   → Check API KEY and 'data.records:read' scope.");
            console.error("   → Check if Token has access to this specific Base.");
        }
        return; // Stop if we can't even read
    }

    // 2. Test WRITE Access
    console.log("\n✏️  Phase 2: Testing WRITE Access...");
    try {
        const records = await table.create([
            {
                fields: {
                    UserId: 'test-user-debug',
                    Role: 'user',
                    Content: 'This is a debug message from test-airtable.ts'
                }
            }
        ]);
        console.log("✅ WRITE Success! Record created with ID:", records[0].id);

        console.log("🗑️ Cleaning up test record...");
        await table.destroy([records[0].id]);
        console.log("✅ Cleanup Success.");

    } catch (error: any) {
        console.error("❌ WRITE Failed:");
        console.error("   Message:", error.message);
        if (error.statusCode === 403 || error.statusCode === 401) {
            console.error("   → Missing 'data.records:write' scope on the Token.");
        } else {
            console.error("   → Check if field names (UserId, Role, Content) match your Airtable columns exactly.");
        }
    }
};

run();
