// Import libraries
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const loginSystem = require("./login");
const sqlite3 = require("sqlite3");

let db = new sqlite3.Database("database.db");

const { login, logout, auth } = loginSystem();

// Create web server
let app = express();

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse post body as json
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

// Set login submit
app.post("/api/login", async (req, res) => {
  let { id, pw } = req.body;
  try {
    let token = await login(id, pw);
    if (token) {
      res.send({ token });
      return;
    }
  } catch {}
  res.status(404).send({ err: "Failed to login" });
});

app.post("/api/logout", (req, res) => {
  if (logout(req.token)) {
    res.send({});
  } else {
    res.status(401).send({ err: "Failed to logout" });
  }
});

app.get("/api/username", (req, res) => {
  if (req.user) {
    res.send({ data: req.user.id });
  } else {
    res.status(401).send({ data: "Dummy", err: "You are not logged in." });
  }
});

app.get("/api/cads", (req, res) => {
  res.sendFile(__dirname + "/public/cad_config.json");
});

app.post("/api/pivot", (req, res) => {
  console.log(req.user, req.body);
  res.status(201).send({});
});

// 404 Route
app.get("*", function (req, res) {
  res.status(404).send("This is 404 page.");
});

// Run server
const PORT = 3001;
app.listen(PORT, () => {
  console.log("Server started at " + PORT);
});
