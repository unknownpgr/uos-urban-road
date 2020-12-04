// Import modules
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require('multer');
const Database = require("sqlite-async");
const loginSystem = require("./login");
const path = require('path');
const fs = require('fs').promises;

const PORT = 1501;
const STREAM_UPLOAD_PATH = path.join(__dirname, 'tmp');
const STREAM_QUEUE_SIZE = 10;

// Database will be assigned in the main function at bottom, before the server started.
let db;

const { login, logout, auth } = loginSystem();
const upload = multer({ dest: STREAM_UPLOAD_PATH });
let streamQueue = [];
let streamLastUploaded = 0;

async function clearStreamCache() {
  const files = await fs.readdir(STREAM_UPLOAD_PATH);
  for (const file of files) fs.unlink(path.join(STREAM_UPLOAD_PATH, file));
}

// Create web server
let app = express();

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse the post body as json
app.use(auth);

/**
 * HTTP Response code
 *
 * 200 : OK
 * 201 : (Resource) Created
 * 202 : (Async task) Accepted
 * 204 : No response required
 *
 * 400 : Bad request
 * 401 : Unauthorized
 * 404 : Not found
 * 405 : (Request method) Not allowed
 * 409 : Conflict
 * 429 : Too many requests
 *
 * Return {} to client when no response required with status code 200.
 * See link below for more information about RESTful API design.
 * https://sanghaklee.tistory.com/57
 */

// Log all requests
app.use((req, res, next) => {
  if (!req.path.endsWith('stream'))
    console.log(new Date(), req.path);
  next();
});

// Set login submit
app.post("/api/login", async (req, res) => {
  let { id, pw } = req.body;
  try {
    let token = await login(id, pw);
    res.send({ token });
    if (!token) console.err("Login token did not generated.");
  } catch (e) {
    console.error(e);
    res.status(404).send({ err: "Failed to login" });
  }
});

// Logout
app.post("/api/logout", (req, res) => {
  if (logout(req.token)) res.send({});
  else res.status(401).send({ err: "Failed to logout" });
});

// Get username
app.get("/api/username", (req, res) => {
  if (req.user) res.send({ data: req.user.id });
  else res.status(401).send({ data: "Dummy", err: "You are not logged in." });
});

// Get CAD file metadata
app.get("/api/sections", async (req, res) => {
  let { user } = req;
  if (user == null) {
    res.status(401).send({ data: "Dummy", err: "You are not logged in." });
    return;
  }
  let station = await db.get(`SELECT station FROM users WHERE id=?`, [user.id]);
  let sections = await db.all(`SELECT * FROM sections WHERE station=?`, [station.station]);
  res.send({ ...station, sections });
});

// Store pivot data of an station
app.post("/api/cali", async (req, res) => {
  try {
    let { data, station, section } = req.body;
    let keys = Object.keys(data);
    await db.transaction(db =>
      Promise.all(keys.map(key => {
        let row = data[key];
        return db.run(`INSERT OR REPLACE INTO calibration (station, section, idx, imgX, imgY, gpsX, gpsY) VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [station, section, row.idx, row.imgX, row.imgY, row.gpsX, row.gpsY]);
      }))
    );
    res.status(201).send({});
  } catch (err) { res.status(400).send({ err }); }
});

// Get pivots of an station
app.get('/api/cali', async (req, res) => {
  let { station, section } = req.query;
  let data = await db.all('SELECT * FROM calibration WHERE station=? AND section=?', [station, section]);
  res.send({ data });
});

// Upload stream
app.post('/api/stream', upload.single('stream'), async (req, res) => {
  let { path } = req.file;
  if (!path) res.status(400).send({ err: 'No stream included in data' });
  else {
    // Buffer is used to prevent stream file being deleted while it is transmitting.
    // Therefore, if the size of stream file is larege, or if there are many requests for stream,
    // the buffer size should be increased.

    streamQueue.push(path);                       // Push given stream into stream queue
    if (streamQueue.length > STREAM_QUEUE_SIZE) { // If queue is full,
      await fs.unlink(streamQueue.shift());       // remove the first(oldest) item
    }
    res.send({ data: 'OK' });                     // Then, send response
    streamLastUploaded = Date.now();              // Update stream last uploaded time
  }
});

// Get uploaded stream
app.get('/api/stream', async (req, res) => {
  // If there are no incoming stream for 10 seconds, assume that client has been stopped.
  if ((Date.now() - streamLastUploaded) > 10000) {
    streamQueue = [];
    await clearStreamCache();
  }
  if (streamQueue.length > 0) {
    // Send the last item(newest) of the queue.
    res.sendFile(streamQueue[streamQueue.length - 1]);
  } else {
    res.status(404).send({ err: 'No stream available' });
  }
});

// Serve sensor data
app.get('/api/data', async (req, res) => {
  let { xs, xe, ys, ye } = req.query;

  // Swap data
  if (xe < xs) {
    let t = xe;
    xe = xs;
    xs = t;
  }
  if (ye < ys) {
    let t = ye;
    ye = ys;
    ys = t;
  }

  // Select data in range
  let data = await db.all(`SELECT * FROM sensor_data WHERE ? < long AND long < ? AND ? < lat AND lat < ?`, [xs, xe, ys, ye]);
  res.send(data);
});

// Receive sensor data from device
app.post('/api/data', async (req, res) => {
  let json = req.body;
  console.log(json);

  let { date, long, lat, alt, max_load, max_dist, e_inv } = json;

  try {
    await db.run('INSERT OR REPLACE INTO sensor_data (date, long, lat, alt, max_load, max_dist, e_inv) VALUES (?,?,?,?,?,?,?)',
      date, long, lat, alt, max_load, max_dist, e_inv);
    res.status(200).send({ msg: 'Successfully received data' }).end();
  } catch {
    res.status(400).send({ msg: 'Message failed' }).end();
  }
});

// Simple database query server.
// TODO : Implement authentication. Runing arbitary SQL is very dangerous.
app.post('/api/temp/database', async (req, res) => {
  let { query } = req.body;
  if (!query) {
    res.send({ status: 'ERR', err: 'Empty query' });
  } else {
    try {
      let result = await db.all(query);
      res.send(JSON.stringify({ status: 'OK', result: result }));
    } catch (err) {
      console.log(err);
      res.send({ status: 'ERR', err });
    }
  }
});

// 404 Route
app.get("*", function (req, res) {
  res.status(404).send("Unknown api detected.");
});

// Run server
async function main() {
  // Open database
  db = await Database.open(path.join(__dirname, "database.db"));
  console.log("Database connected.");

  // Clear stream cache
  await clearStreamCache();
  console.log("Stream cache cleared.");

  // Start server listening
  app.listen(PORT, () => {
    console.log("Server started at port " + PORT);
  });
}
main();
