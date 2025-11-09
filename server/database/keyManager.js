const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const dbPath = path.join(__dirname, "keys.db");
const db = new Database(dbPath);

// Create keys table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        duration_minutes INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

function generateRandomKey() {
    // Generate random alphanumeric string (12 characters)
    const randomPart = crypto.randomBytes(12).toString("hex").toUpperCase();
    return `aeris${randomPart}`;
}

function createKey(durationMinutes) {
    const key = generateRandomKey();
    const stmt = db.prepare("INSERT INTO keys (key, duration_minutes) VALUES (?, ?)");
    
    try {
        stmt.run(key, durationMinutes);
        return { success: true, key, durationMinutes };
    } catch (error) {
        console.error("[KeyManager] Error creating key:", error);
        return { success: false, error: error.message };
    }
}

function checkKey(key) {
    const stmt = db.prepare("SELECT * FROM keys WHERE key = ?");
    return stmt.get(key);
}

function deleteKey(key) {
    const stmt = db.prepare("DELETE FROM keys WHERE key = ?");
    const result = stmt.run(key);
    return result.changes > 0;
}

function getAllKeys() {
    const stmt = db.prepare("SELECT * FROM keys ORDER BY created_at DESC");
    return stmt.all();
}

module.exports = {
    createKey,
    checkKey,
    deleteKey,
    getAllKeys
};
