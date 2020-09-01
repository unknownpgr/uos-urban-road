// Import libraries
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const loginSystem = require("./login");

const users = {
  loginID: { pw: "loginPW" },
  ServerMaster: { pw: "rnjswnsgh" },
  road1: { pw: "road1" },
};

const { login, logout, auth } = loginSystem(users);

// Create web server
let app = express();

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse post body as json
app.use(auth);

// Set login submit
app.post("/api/login", (req, res) => {
  let { id, pw } = req.body;
  let token = login(id, pw);
  if (token) {
    res.send({ status: "ok", token });
  } else {
    res.send({ status: "err", err: "Failed to login" });
  }
});

// Set logout
app.post("/api/logout", (req, res) => {
  if (logout(req.token)) {
    res.send({ status: "ok" });
  } else {
    res.send({ status: "err", err: "Failed to logout" });
  }
});

app.get("/api/username", (req, res) => {
  if (req.user) {
    res.send({ status: "ok", data: req.user.id });
  } else {
    res.send({ status: "err", data: "Dummy", err: "You are not logged in." });
  }
});

app.get("/api/cads", (req, res) => {
  res.sendFile(__dirname + "/public/cad_config.json");
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
