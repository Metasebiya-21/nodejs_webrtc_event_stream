const passport = require('passport');
const express = require('express');
const {jwtsecret} = require('../config/jwt')

var router = express.Router();
//////////////////////added////////
// const express = require('express');
const user_information_ctrl = require('../models/users.model.js');
const user_acc_type_ctrl = require('../models/usersAccountType.model.js');
const user_pass_ctrl = require('../models/usersPassword.model.js');
const user_address_ctrl = require('../models/usersAddress.model.js');
const applinkedin = express();
const session = require('express-session');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var config = require('../models/linkedConfieg');
const jwt = require('jsonwebtoken');
applinkedin.set('view engine', 'ejs');
applinkedin.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET',
  })
);
//////////added//
var userProfile;
var userToken;
var accessTokens;
var userss;
/////////end added//////
applinkedin.use(passport.initialize());
applinkedin.use(passport.session());
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
passport.use(
  new LinkedInStrategy(
    {
      clientID: config.linkedinAuth.clientID,
      clientSecret: config.linkedinAuth.clientSecret,
      callbackURL: config.linkedinAuth.callbackURL,
      scope: ['r_emailaddress', 'r_liteprofile'],
    },
    function (token, tokenSecret, profile, callback) {
      userProfile = profile;
      userToken = token;
      let filOne = profile.displayName.split(' ');
      var firtsName = filOne[0];
      var lastName = filOne[1];
      const data = {
        firstName: firtsName,
        lastName: lastName,
        sex: profile.sex,
        age: profile.age,
        status: 0,

        //  totalPrice } = JSON.stringify(req.body[i]);
      };
      const data1 = {
        email: profile.emails[0].value,
        phone: profile.phone_number,
      };
      user_information_ctrl.create(data, (result1) => {
        if (result1) {
          console.log(resualt1);
          res.status(200).json({ reualt: result1 });
        }
      });
      user_address_ctrl.create(data1);
      const email = profile.emails[0].value;
      const phone = profile.phone_number;

      user_address_ctrl
        .findOne({ where: { email: email, phone_number: phone } })
        .then((resualt) => {
          if (resualt.length == 0) {
            res
              .status(200)
              .json({
                NOTIFY:
                  'You have to use email instead of phone number to login.!',
              });
          } else {
            if (resualt.email) {
              const expiresIn = 24 * 60 * 60;
              accessTokens = jwt.sign(
                { email: resualt.email },
                jwtsecret.secret,
                {
                  expiresIn: expiresIn,
                }
              );
            } else {
              accessTokens = jwt.sign(
                { phone: data.phone },
                jwtsecret.secret,
                {
                  expiresIn: expiresIn,
                }
              );
            }
            userss = result.id;
            return callback(null, userProfile, userToken, accessTokens, userss);
          }
        });

      //end getby email loop
      // return done(null, profile);
    }
  )
);
router.get(
  '/auth/linkedin',
  passport.authenticate('linkedin', {
    scope: ['r_emailaddress', 'r_liteprofile'],
  })
);

router.get(
  '/auth/linkedin/callback',
  passport.authenticate('linkedin', {
    // successRedirect: '/profile',
    failureRedirect: '/login',
  }),
  function (req, res) {
    // Successful authentication, redirect success.
    // res.status(200).json({ sucess: 'success!',user: userProfile,token:userToken,jwtToken:accessTokens,user_id:userss});
    res.redirect('/');
    //res.redirect(`http://adimera.net/#/socialoauth?token=${accessTokens}&user_id=${userss}`);
  }
);
router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
