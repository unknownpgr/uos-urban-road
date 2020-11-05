const sqlite3 = require("sqlite3");

let db = new sqlite3.Database("database.db");

let table_calibration = `
CREATE TABLE calibration (
    cad   TEXT,
    src_x INTEGER,
    src_y INTEGER,
    dst_x INTEGER,
    dst_y INTEGER
);
`;

let table_user = `
CREATE TABLE users (
    id TEXT NOT NULL UNIQUE PRIMARY KEY,
    pw TEXT
);
`;

db.run(table_calibration, console.error);
db.run(table_user, console.error);
