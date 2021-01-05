const tokenSystem = require("./token");
const Database = require("sqlite-async");

/**
 * @param {Number} expireTime
 * @param {String} tokenKey
 */
function loginSystem(databasePath, expireTime = 1000 * 60 * 60, tokenKey = "token") {
  let { create, check, expire } = tokenSystem(expireTime, tokenKey);
  let session = {};
  let db;

  (async () => db = await Database.open(databasePath))();

  /**
   * Process login
   * @param {String} id 
   * @param {String} pw 
   */
  async function login(id, pw) {
    console.log(id, pw);
    let row = await db.get(
      "SELECT id FROM users WHERE id = ? AND pw = ?",
      [id, pw]);

    let token = create();
    session[token] = row;
    return token;
  }

  /**
   * Process logout
   * @param {String} token 
   */
  function logout(token) {
    if (!session[token]) return false;
    session[token] = undefined;
    delete session[token];
    return expire(token);
  }

  /**
   * Check if given user is authorized
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
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
