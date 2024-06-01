const authenticateJWT = (req, res, next) => {
  // const SECRET_KEY = 'secretkey23456';
  const authHeader = req.headers.authorization;
  console.log('header is',authHeader)
  const jwt = require('jsonwebtoken');
  const {jwtsecret} = require('../config/jwt')
  console.log('authorization jwtsecret.secret ',  jwtsecret.secret)
  if (authHeader) {
    let token=authHeader.split('Bearer ')[1].trim();
    jwt.verify(token, jwtsecret.secret, (err, user) => {
      if (err) {
       return res.send({ msg: 'Token is not valid' });
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};
module.exports = {
  authenticateJWT,
};
