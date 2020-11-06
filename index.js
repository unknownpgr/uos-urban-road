// Import libraries
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const loginSystem = require("./login");
const Database = require("sqlite-async");

const PORT = 1501;

// Database will be assigned in the main function at bottom, before the server started.
let db;

const { login, logout, auth } = loginSystem();

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
app.get("/api/cads", (req, res) => {
  res.sendFile(__dirname + "/public/cad_config.json");
});

// Set pivot of an CAD file
app.post("/api/cali", async (req, res) => {
  try {
    let { img, data } = req.body;
    let keys = Object.keys(data);
    await db.transaction(db =>
      Promise.all(keys.map(key => {
        let row = data[key];
        return db.run(`REPLACE INTO calibration (cad, idx, imgX, imgY, gpsX, gpsY) VALUES (?, ?, ?, ?, ?, ?);`,
          [img, key, row.imgX, row.imgY, row.gpsX, row.gpsY]);
      }))
    );
    res.status(201).send({});
  } catch (err) { res.status(400).send({ err }); }
});

// Get pivots of an CAD file
app.get('/api/cali', async (req, res) => {
  let data = await db.all('SELECT * FROM calibration WHERE cad=?', [req.query.img]);
  res.send({ data });
});

// 404 Route
app.get("*", function (req, res) {
  res.status(404).send("Unknown api detected.");
});

// Run server
async function main() {
  db = await Database.open("database.db");
  app.listen(PORT, () => {
    console.log("Server started at port " + PORT);
  });
}
main();
