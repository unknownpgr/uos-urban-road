const sqlite3 = require("sqlite3");
const fs = require('fs').promises

let table_calibration = `
CREATE TABLE calibration (
    cad   TEXT,
    idx   INTEGER,
    img_x INTEGER,
    img_y INTEGER,
    gps_x INTEGER,
    gps_y INTEGER,
    UNIQUE(cad, idx)
);`;

let table_user = `
CREATE TABLE users (
    id TEXT NOT NULL UNIQUE PRIMARY KEY,
    pw TEXT
);`;

function promisifyDBFunction(db, func) {
    return (query, params) => {
        if (!params) params = []
        return new Promise((resolve, reject) => {
            db[func](query, (err) => {
                if (err) reject(err);
                else resolve();
            })
        })
    }
}

function promisifyDB(db) {
    db.get = promisifyDBFunction(db, 'get')
    db.run = promisifyDBFunction(db, 'run')
    db.all = promisifyDBFunction(db, 'all')
}

async function initDB(database_file) {
    // Check file name
    if (!database_file.endsWith('.db')) throw new Error(`[${database_file}] does not seem to be a database file.`)

    // Remove existing datatbase file
    try { await fs.unlink(database_file); } catch { }

    // Create a new database
    let db = new sqlite3.Database(database_file);
    promisifyDB(db)

    try {
        // Create calibration table
        await db.run(table_calibration);
        // Create user table
        await db.run(table_user);
        // Insert test user
        await db.run(`INSERT INTO users (id, pw) VALUES ("road1", "road1")`);
    } catch (e) {
        console.error(e)
    }
}

module.exports = { initDB, promisifyDB }