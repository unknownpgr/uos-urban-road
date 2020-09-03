const sqlite3 = require("sqlite3");

let db = new sqlite3.Database("database.db");

let table_calibration = `
CREATE TABLE calibration (
    src_x1 INTEGER,
    src_x2 INTEGER,
    src_y1 INTEGER,
    src_y2 INTEGER,
    dst_x1 INTEGER,
    dst_x2 INTEGER,
    dst_y1 INTEGER,
    dst_y2 INTEGER
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
