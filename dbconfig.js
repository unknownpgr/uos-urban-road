const sqlite3 = require("sqlite3");
const fs = require('fs')

const DB_NAME = "database.db"

let db = new sqlite3.Database(DB_NAME);

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

function err(e) {
    if (e) console.error(e)
}

try { fs.unlinkSync(DB_NAME); } catch { }
db.run(table_calibration, err);
db.run(table_user, err);
setTimeout(() => {
    db.run(`INSERT INTO users (id, pw) VALUES ("road1", "road1")`, err);
}, 100);