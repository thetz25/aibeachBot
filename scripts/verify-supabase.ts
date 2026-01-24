
import dotenv from 'dotenv';
import path from 'path';

// Load env explicitly
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

import { saveMessage, getHistory } from '../src/services/db.service';

async function testSupabase() {
    console.log("🔍 Testing Supabase Connection...");
    console.log(`   URL: ${process.env.SUPABASE_URL}`);

    // Test Write
    console.log("✏️  Testing SAVE...");
    await saveMessage('test-user-sb', 'user', 'Hello from Supabase Client!');

    // Test Read
    console.log("📖 Testing READ...");
    const history = await getHistory('test-user-sb');
    console.log(`✅ Retrieved ${history.length} messages.`);
    if (history.length > 0) {
        console.log("   Latest:", history[history.length - 1]);
    } else {
        console.log("⚠️ No messages found. (Did the save work?)");
    }
}

testSupabase();
