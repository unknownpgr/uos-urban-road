const Database = require("sqlite-async");
const fs = require('fs').promises

let table_calibration = `
CREATE TABLE calibration (
    cad   TEXT NOT NULL,
    idx   INTEGER NOT NULL,
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

async function initDB(database_file) {
    // Check file name
    if (!database_file.endsWith('.db')) throw new Error(`[${database_file}] does not seem to be a database file.`)

    // Remove existing datatbase file
    try { await fs.unlink(database_file); } catch { }

    // Create a new database
    let db = await Database.open(database_file);

    // Create calibration table
    await db.run(table_calibration);
    // Create user table
    await db.run(table_user);
    // Insert test user
    await db.run(`INSERT INTO users (id, pw) VALUES ("road1", "road1")`);
}

initDB();