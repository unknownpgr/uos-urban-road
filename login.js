let tokenSystem = require("./token");
const Database = require("sqlite-async");

let db;
(async () => db = await Database.open("database.db"))();

/**
 * @param {Number} expireTime
 * @param {String} tokenKey
 */
function loginSystem(expireTime = 1000 * 60 * 60, tokenKey = "token") {
  let { create, check, expire } = tokenSystem(expireTime, tokenKey);
  let session = {};
  async function login(id, pw) {
    let row = await db.get(
      "SELECT id FROM users WHERE id = ? AND pw = ?",
      [id, pw])

    let token = create();
    session[token] = row;
    return token;
  }

  function logout(token) {
    if (!session[token]) return false;
    session[token] = undefined;
    delete session[token];
    return expire(token);
  }

  function auth(req, res, next) {
    let token =
      req.query[tokenKey] || req.body[tokenKey] || req.params[tokenKey];
    if (check(token)) {
      req.token = token;
      req.user = session[token];
    } else {
      session[token] = undefined;
      req.user = undefined;
      req.token = undefined;
      delete session[token];
    }
    next();
  }

  return { login, logout, auth };
}

module.exports = loginSystem;
