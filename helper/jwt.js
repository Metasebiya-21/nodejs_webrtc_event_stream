const expressJwt = require('express-jwt');
const config=require('config');
function authJwt() {
    const secret =  config.get("jwtSecret");
    return expressJwt({
        secret,
        algorithms: ['HS256']
    })
}

module.exports = authJwt