const Database = require("sqlite-async");
const fs = require('fs').promises;

let table_calibration = `
CREATE TABLE calibration (
    cad   TEXT NOT NULL,
    idx   INTEGER NOT NULL,
    imgX INTEGER,
    imgY INTEGER,
    gpsX INTEGER,
    gpsY INTEGER,
    UNIQUE(cad, idx)
);`;

let table_user = `
CREATE TABLE users (
    id TEXT NOT NULL UNIQUE PRIMARY KEY,
    pw TEXT
);`;

async function initDB(database_file) {
    // Create a new database
    let db = await Database.open(database_file);
    // Drop tables
    await db.run(`DROP TABLE users`);
    await db.run(`DROP TABLE calibration`);
    // Create calibration table
    await db.run(table_calibration);
    // Create user table
    await db.run(table_user);
    // Insert test user
    await db.run(`INSERT INTO users (id, pw) VALUES ("road1", "road1")`);
}

initDB('database.db');