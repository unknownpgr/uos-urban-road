const sqlite3 = require("sqlite3");
const fs = require('fs').promises
const util = require('util')

const DB_NAME = "database.db"

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

async function main() {
    // Remove existing datatbase file
    try { await fs.unlink(DB_NAME); } catch { }

    // Create a new database
    let db = new sqlite3.Database(DB_NAME);
    let db_run = function (query, callback) {
        return new Promise((resolve, reject) => {
            db.run(query, (err) => {
                if (err) reject(err);
                else resolve();
            })
        })
    }

    try {
        // Create calibration table
        await db_run(table_calibration);
        // Create user table
        await db_run(table_user);
        // Insert test user
        await db_run(`INSERT INTO users (id, pw) VALUES ("road1", "road1")`);
    } catch (e) {
        console.error(e)
    }
}

main()