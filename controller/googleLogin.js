/*  EXPRESS */
const express = require('express');
const appsss = express();
const session = require('express-session');
const confign = require('config');
const Sequelize = require('sequelize');
const SECRET_KEY = "mysecrettoken";
var router = express.Router(); //handles routing paths
const user_information_ctrl = require('../models/users.model.js');
const user_acc_type_ctrl = require('../models/usersAccountType.model.js');
const user_pass_ctrl = require('../models/usersPassword.model.js');
const user_address_ctrl = require('../models/usersAddress.model.js');
const jwt = require('jsonwebtoken');
const Op = Sequelize.Op;
appsss.set('view engine', 'ejs');

appsss.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET',
  })
);

var passport = require('passport');
var userProfile;
var userToken;
var accessTokens;
var userss;
appsss.use(passport.initialize());
appsss.use(passport.session());
// router.get('/error', (req, res) => res.send("error logging in"));
const dotenv = require("dotenv");
dotenv.config();

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const { result } = require('lodash');
const GOOGLE_CLIENT_ID = process.env.google_client_id
const GOOGLE_CLIENT_SECRET = process.env.google_client_secret

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://ethiolive.net/api/auth/google/callback',
  
    },
  async  function (accessToken, refreshToken, profile, callback) {
      userProfile = profile;
      userToken = accessToken;
      console.log(profile)
      ///////////////
      //////////////////////////
      // profile.forEach((element) => {
      let filOne = profile.displayName.split(' ');
      var firtsName = filOne[0];
      var lastName = filOne[1];
      var userId
     const email = profile.emails[0].value;
     const phone = profile.phone_number;
     var flag
     var password='passwords'
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
}).then(()=>{
  console.log("yable created.")
}).catch(err=>{
  console.log(err)
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
        return callback(null, userProfile, userToken, accessTokens, userss);
      
    });
})
  })
  
    }
     
    }
  )
);
///////the scope: holds both gmail profile and email on the broser
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/error' }),
  function (req, res) {

    //res.redirect(https://kushlivestock.com/#/socialoauth?token=${accessTokens}&user_id=${userss});
    res.redirect(
      `https://ethiolive.net/socialoauth?token=${accessTokens}&user_id=${userss}`
    );
  }
);//socialoauth

module.exports = router;
