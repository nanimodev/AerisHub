const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "database", "users.db");
const db = new Database(dbPath);

// Create users table and user_keys table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS user_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        key TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);

function getOrCreateUser(userId, username) {
    // Check if user exists
    let user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    
    if (!user) {
        // Create new user
        db.prepare("INSERT INTO users (id, username) VALUES (?, ?)").run(userId, username);
        user = { id: userId, username };
    }
    
    return user;
}

function addUserKey(userId, key, durationMinutes) {
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const stmt = db.prepare(`
        INSERT INTO user_keys (user_id, key, duration_minutes, expires_at)
        VALUES (?, ?, ?, ?)
    `);
    
    try {
        stmt.run(userId, key, durationMinutes, expiresAt);
        return { success: true };
    } catch (error) {
        console.error("[Database] Error adding user key:", error);
        return { success: false, error: error.message };
    }
}

function getUserKeys(userId) {
    const stmt = db.prepare(`
        SELECT * FROM user_keys 
        WHERE user_id = ? 
        ORDER BY redeemed_at DESC
    `);
    return stmt.all(userId);
}

function removeExpiredKeys(userId) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
        DELETE FROM user_keys 
        WHERE user_id = ? AND expires_at < ?
    `);
    const result = stmt.run(userId, now);
    return result.changes;
}

function hasValidKey(userId) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
        SELECT COUNT(*) as count FROM user_keys 
        WHERE user_id = ? AND expires_at > ?
    `);
    const result = stmt.get(userId, now);
    return result.count > 0;
}

module.exports = {
    getOrCreateUser,
    addUserKey,
    getUserKeys,
    removeExpiredKeys,
    hasValidKey
};
