let tokenSystem = require("./token");

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
    if (!users[id]) return false;
    if (users[id].pw !== pw) return false;
    let token = create();
    users[id].id = id;
    session[token] = users[id];
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
      delete session[token];
      req.user = undefined;
      req.token = undefined;
    }
    next();
  }

  return { login, logout, auth };
}

module.exports = loginSystem;
