/*
The token system only manages tokens. The only information stored in the token system is the name of the token and its expiration time.
You can perform the following operations on the token:
1. Creation of a new token
2. Extension of existing token expiration time
3. Token deletion
 */

function getRandom(length = 10) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Create token system
 * @param {Number} expireTime How long each token is held
 * @param {String} tokenKey The variable name to use to represent the token in the req object. The default is "token".
 */
function tokenSystem(expireTime = 1000 * 60 * 60, tokenKey = "token") {
  let session = {};

  /**
   * Create new token and return its name.
   */
  function create() {
    let token = getRandom();
    while (session[token]) token = getRandom();
    session[token] = {
      expire: Date.now() + expireTime,
    };
    return token;
  }

  /**
   * Update the expiration time of given token
   * @param {String} token
   */
  function check(token) {
    if (!session[token]) return false;
    if (Date.now() > session[token].expire) {
      expire(token);
      return false;
    }
    session[token].expire = Date.now() + expireTime;
    return true;
  }

  /**
   * Expire the token
   * @param {String} token
   */
  function expire(token) {
    if (!session[token]) return false;
    session[token] = undefined;
    delete session[token];
    return true;
  }

  return { create, check, expire };
}

module.exports = tokenSystem;
