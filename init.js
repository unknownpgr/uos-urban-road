const Database = require("sqlite-async");

let table_stations = `
CREATE TABLE stations (
    station TEXT PRIMARY KEY
);`;

let table_sections = `
CREATE TABLE sections (
    station     TEXT NOT NULL,
    section     TEXT NOT NULL,
    cad_file    TEXT NOT NULL UNIQUE,
    width       INTEGER NOT NULL,        
    height      INTEGER NOT NULL,
    FOREIGN KEY(station) REFERENCES stations(station)
    PRIMARY KEY(station, section)
);`;

let table_calibration = `
CREATE TABLE calibration (
    station TEXT NOT NULL,
    section TEXT NOT NULL,
    idx     INTEGER NOT NULL,
    imgX    INTEGER,
    imgY    INTEGER,
    gpsX    INTEGER,
    gpsY    INTEGER,
    PRIMARY KEY(station, section, idx),
    FOREIGN KEY(station, section) REFERENCES stations(station, section)
);`;

let table_sensor_data = `
CREATE TABLE sensor_data (
    date        TEXT NOT NULL UNIQUE,
    long        REAL NOT NULL,
    lat         REAL NOT NULL,
    max_load    REAL NOT NULL,
    max_dist    REAL NOT NULL,
    e_inv       REAL NOT NULL
);`;

let table_user = `;
CREATE TABLE users(
    id      TEXT NOT NULL UNIQUE PRIMARY KEY,
    pw      TEXT NOT NULL,
    station TEXT NOT NULL,
    FOREIGN KEY(station) REFERENCES stations(station)
); `;

async function initDB(database_file) {
    // Create a new database or open existing database
    let db = await Database.open(database_file);

    // Enable foreign key
    await db.run(`PRAGMA foreign_keys = 1`);

    // Drop tables
    await db.run(`DROP TABLE IF EXISTS calibration`);
    await db.run(`DROP TABLE IF EXISTS users`);
    await db.run(`DROP TABLE IF EXISTS sections`);
    await db.run(`DROP TABLE IF EXISTS stations`);
    await db.run(`DROP TABLE IF EXISTS sensor_data`);

    // Create tables
    await db.run(table_stations);
    await db.run(table_sections);
    await db.run(table_sensor_data);
    await db.run(table_calibration);
    await db.run(table_user);

    console.log('Tables successfully created');

    // Insert test station
    await db.run(`INSERT INTO stations(station) VALUES("포천방향")`);
    console.log(await db.all('SELECT * FROM stations'));

    // Insert test user
    await db.run(`INSERT INTO users(id, pw, station) VALUES("road1","road1","포천방향")`);
    console.log(await db.all('SELECT * FROM users'));

    console.log('Database successfully initialized.');
}

initDB('database.db');