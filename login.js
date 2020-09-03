let tokenSystem = require("./token");
const sqlite3 = require("sqlite3");

let db = new sqlite3.Database("database.db");

/**
 *
 * @param {Dict} users
 * @param {Number} expireTime
 * @param {String} tokenKey
 */
function loginSystem(users, expireTime = 1000 * 60 * 60, tokenKey = "token") {
  let { create, check, expire } = tokenSystem(expireTime, tokenKey);
  let session = {};
  function login(id, pw) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT id FROM users WHERE id = ? AND pw = ?",
        [id, pw],
        (err, row) => {
          if (err) reject(err);
          else if (row) {
            let token = create();
            session[token] = row;
            resolve(token);
          } else {
            reject();
          }
        }
      );
    });
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
      delete session[token];
      req.user = undefined;
      req.token = undefined;
    }
    next();
  }

  return { login, logout, auth };
}

module.exports = loginSystem;
