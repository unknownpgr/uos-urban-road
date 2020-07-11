// Import libraries
const express = require("express");
const session = require("express-session");

// Certify user
function certify(id, pw) {
  const allowedUsers = [
    { id: "loginID", pw: "loginPW" },
    { id: "ServerMaster", pw: "rnjswnsgh" },
  ];

  const allowd = allowedUsers.reduce(
    (pre, cur) => pre || (id == cur.id && pw == cur.pw),
    false
  );

  console.log(id, pw, allowd);

  return allowd;
}

// Create web server
let app = express();

// Set middleware
app.use(
  session({
    secret: "THIS_IS_MY_SECRET_KEY:@!#$#$!@$%##@%$@$%#@!#^%&^*(*(&^%$#@!",
    resave: false,
    saveUninitialized: true,
  })
);
app.use((req, res, next) => {
  const path = req.path;

  const loginUnrequired =
    path.startsWith("/css") ||
    path.startsWith("/img") ||
    path.startsWith("/js");

  const isLoginProcess =
    path.startsWith("/login") || path.startsWith("/login-submit");

  const isLoggedIn = req.session.loggedIn;

  if (loginUnrequired) next();
  else if (isLoggedIn) {
    if (isLoginProcess) res.redirect("/");
    else next();
  } else {
    if (isLoginProcess) next();
    else res.redirect("/login");
  }
});
app.use(express.static(__dirname + "/public"));

// Set default page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Set login page
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

// Set login submit
app.get("/login-submit", (req, res) => {
  const { id, pw } = req.query;
  if (certify(id, pw)) {
    req.session.loggedIn = true;
    res.redirect("/");
  } else res.redirect("back");
});

// Set logout
app.get("/logout", (req, res) => {
  // Since we are going to remove the session, there is no need to initialize it.
  // However, because an error can occurs during session deletion, it is safer to initialize it before destroy.
  console.log("Logged out!");
  req.session.loggedIn = false;
  req.session.destroy();
  res.redirect("/login");
});

// Run server
app.listen(8080, () => console.log("Server started"));
