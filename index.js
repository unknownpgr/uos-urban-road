// Import libraries
const express = require("express");
const session = require("express-session");

// Create web server
let app = express();

// Set middleware
app.use(express.static(__dirname + "/public"));
app.use((req, res, next) => {
  next();
});

// Set default page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Run server
app.listen(8080, () => console.log("Server started"));
