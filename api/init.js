const Database = require("sqlite-async");

const TEST_SECTION = '아산천안 1공구';

let table_stations = `
CREATE TABLE stations (
    station TEXT PRIMARY KEY
);`;

let table_sections = `
CREATE TABLE sections (
    station     TEXT    NOT NULL,
    section     TEXT    NOT NULL,
    cad_file    TEXT    NOT NULL UNIQUE,
    width       INTEGER NOT NULL,        
    height      INTEGER NOT NULL,
    FOREIGN KEY(station) REFERENCES stations(station)
    PRIMARY KEY(station, section)
);`;

let table_calibration = `
CREATE TABLE calibration (
    station TEXT    NOT NULL,
    section TEXT    NOT NULL,
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
    date        INTEGER PRIMARY KEY,
    long        REAL    NOT NULL,
    lat         REAL    NOT NULL,
    alt         REAL    NOT NULL,
    max_load    REAL    NOT NULL,
    max_dist    REAL    NOT NULL,
    e_inv       REAL    NOT NULL
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
    await db.run(`INSERT INTO stations(station) VALUES("${TEST_SECTION}")`);
    console.log(await db.all('SELECT * FROM stations'));

    // Insert test user
    await db.run(`INSERT INTO users(id, pw, station) VALUES("road1","road1","${TEST_SECTION}")`);
    console.log(await db.all('SELECT * FROM users'));

    // Insert test sensor data
    let promises = [
        ["11/09/2020", 0.02071, 0.1324, 0.21387, 0.50817, 0.47047, 0.53267],
        ["11/10/2020", 0.66872, 0.3546, 0.32397, 0.11227, 0.56167, 0.42237],
        ["11/11/2020", 0.59134, 0.4468, 0.22402, 0.18402, 0.18092, 0.90762],
        ["11/12/2020", 0.69214, 0.1924, 0.29991, 0.80251, 0.32961, 0.43471],
        ["11/13/2020", 0.24425, 0.4748, 0.25392, 0.83982, 0.14712, 0.66772],
        ["11/14/2020", 0.97246, 0.9764, 0.08954, 0.74404, 0.55464, 0.76964],
        ["11/15/2020", 0.19364, 1.5372, 0.20895, 0.96845, 0.08725, 0.29215],
    ].map(row => {
        row[0] = Math.floor(new Date(row[0]).getTime() / 1000);
        return db.run(`INSERT INTO sensor_data VALUES(?,?,?,?,?,?,?)`, row);
    });
    await Promise.all(promises);
    console.log(await db.all(`SELECT * FROM sensor_data`));

    console.log('Database successfully initialized.');
}

initDB('database.db');