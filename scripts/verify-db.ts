
import dotenv from 'dotenv';
import path from 'path';

// Load env vars explicitly from root
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

import { saveMessage, getHistory } from '../src/services/db.service';

async function testDB() {
    console.log("🔍 Testing Database Connection...");

    // Test Write
    console.log("✏️  Testing SAVE...");
    await saveMessage('test-user-db', 'user', 'Hello from PostgreSQL!');

    // Test Read
    console.log("📖 Testing READ...");
    const history = await getHistory('test-user-db');
    console.log(`✅ Retrieved ${history.length} messages.`);
    if (history.length > 0) {
        console.log("   Latest:", history[history.length - 1]);
    }

    console.log("🎉 Database verification complete.");
    process.exit(0);
}

testDB().catch(err => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});
