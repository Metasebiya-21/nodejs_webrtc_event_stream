
const express = require('express');
const passport = require("passport");
var router = express.Router();
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const SECRET_KEY = "mysecrettoken";
///////////////////////
// const express = require('express');
const appFacebook = express();
const session = require('express-session');
// const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
// const routes = require('./routes.js');
// const config = require('./config')
const user_information_ctrl = require('../models/users.model.js');
const user_acc_type_ctrl = require('../models/usersAccountType.model.js');
const user_pass_ctrl = require('../models/usersPassword.model.js');
const user_address_ctrl = require('../models/usersAddress.model.js');
var config = require('../models/facebookConfig');
const jwt = require('jsonwebtoken');

const confign = require('config');
appFacebook.set('view engine', 'ejs');
appFacebook.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: 'mysecrettoken',
  })
);
//////////added//
var userProfile;
var userToken;
var accessTokens;
var userss;
/////////end added//////
var userInfo
appFacebook.use(passport.initialize());
appFacebook.use(passport.session());

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});
passport.use(
  new FacebookStrategy(
    {
      clientID: config.facebookAuth.clientID,
      clientSecret: config.facebookAuth.clientSecret,
      callbackURL: config.facebookAuth.callbackURL,
      profileFields:['emails','name','displayName']
    },
 async function (accessToken, refreshToken, profile, callback) {

      console.log(profile)
      userProfile = profile;
      userToken = accessToken;
      ///////////////
      //////////////////////////
      // profile.forEach((element) => {
        let fullName = profile.displayName.split(" ");
      var firtsName = fullName[0];
      var lastName = fullName[1];
      const email = profile.emails[0].value;
      const check = await user_address_ctrl.findOne({
        where: { email:email },
      });
      if(check){
        console.log('user is already exists')
        user_address_ctrl
        .findOne({ where: {email: email},
          include: [
            {
              model: user_information_ctrl,
            },
          ],
        
        })
        .then((resualt) => {
          if (resualt.length == 0) {
            res
              .status(200)
              .json({
                NOTIFY:
                  'You have to use email instead of phone number to login.!',
              });
          } 
          else {
            if (resualt.email) {
              const expiresIn="24h";
              accessTokens = jwt.sign(
                { email: resualt.email },
          SECRET_KEY,
                {
                  expiresIn: expiresIn,
                }
              );
            } 
            console.log(resualt)
            
            userss = resualt.usersInfo.userId
            console.log(accessTokens)
            console.log(userss)
            return callback(null, userProfile, userToken, accessTokens, userss);
          }
        });
      }
      else{
        user_information_ctrl.create({
          FirstName: firtsName,
          MiddleName: "No",
          LastName: lastName,
          username:firtsName,
          Account_Status: 'active'
        
        }).then((resualt)=>{
  userId=resualt.userId
  console.log(userId)
  user_acc_type_ctrl.create({
    user_id: resualt.userId,
    account_type:'non-premimum'
  })
  user_address_ctrl.create({

    email: email,
    user_id: resualt.userId,
  }).then((resualt)=>{
    user_address_ctrl
    .findOne({ where: {email: email},
      include: [
        {
          model: user_information_ctrl,
        },
      ],
    
    })
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
          const expiresIn="24h";
          accessTokens = jwt.sign(
            { email: resualt.email },
      SECRET_KEY,
            {
              expiresIn: expiresIn,
            }
          );
        } 
        console.log(resualt)
        console.log(accessTokens)
        console.log(userss)
        userss = resualt.usersInfo.userId
        return callback(null, userProfile, userToken, accessTokens, userss);
      }
    });
  })
    })
        
      }
    }
  )
);

router.get(
  '/auth/facebook',
  passport.authenticate('facebook', { scope: ["public_profile", "email"] })
);
router.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/error' }),
  function (req, res) {

    //res.redirect(https://kushlivestock.com/#/socialoauth?token=${accessTokens}&user_id=${userss});
    res.redirect(
      `https://ethiolive.net/socialoauth?token=${accessTokens}&user_id=${userss}`
    );
  }
)
module.exports = router;
