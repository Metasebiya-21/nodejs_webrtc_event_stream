const express = require('express');
const router = express.Router();
const user_information = require('../models/users.model.js');
const user_acc_type = require('../models/usersAccountType.model.js');
const user_pass = require('../models/usersPassword.model.js');
const user_address = require('../models/usersAddress.model.js');
const user_acc_type_ctrl = require('../models/usersAccountType.model.js');
const bcrypt = require('bcryptjs');
const {jwtsecret} = require('../config/jwt')

const jwt = require('jsonwebtoken');
const user_pass_ctrl = require('../models/usersPassword.model.js');
// const { check } = require('express-validator');
const SECRET_KEY = 'secretkey23456';
function validateEmail(email) {
 // email_pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,4}$/;

 email_pattern=/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
  return email_pattern.test(email);
}
//
var emaile2, userName, firstName, middleName;
router.post('/', async (req, res) => {
  var id, role;
  //identify whether the user input's username or email
  var flag = 0;
  const user_identifier = req.body.user_identifier;
  // res.json({message: validate_email})

  check = validateEmail(user_identifier);
  //emai
  if (check) {
    var query = await user_address.findOne({
      where: { email: user_identifier },
      include: [{ model: user_information }],
    });

    if (Boolean(query)) {
      name = query.usersInfo.username;
      var account_status = query.usersInfo.Account_Status;
      if (account_status === 'active') {
        flag = 1;
      } else {
        console.log('emaile is not veriefied')
        return res.status(200).json({ Notverified: 'Account Not Verified' });
      }
    } else {
      console.log('username is not exists')
      return res
        .status(200)
        .json({ emailFailure: 'incorrect email! or email.' });
    }
  }
  //username
  else {
    var query = await user_information.findOne({
      where: { username: user_identifier },
    });
   // name = query.username;

    if (query) {
      var account_status = query.Account_Status;
      if (account_status === 'active') {
        flag = 2;
      } else {
        console.log('emaile is not verified')
        return res.status(200).json({ Notverified: 'Account Not Verified' });
      }
    } else {
      console.log('emial does not exists')
      return res
        .status(200)
        .json({ emailFailure: 'incorrect user name or email!.' });
    }
  }
  //fetch the user password
  var user_password;
  if (flag === 1) {
    var result = await user_address.findOne({
      where: { email: user_identifier },
      include: [
        {
          model: user_information,
          include: [{ model: user_pass }, { model: user_acc_type_ctrl }],
        },
      ],
    });
    // res.status(200).json({ result }); //password
    user_password = result.usersInfo.usersPassword.password;
    role = result.usersInfo.usersAccountType.account_type;
    firstName = result.usersInfo.FirstName;
    middleName = result.usersInfo.MiddleName;
    userName = result.usersInfo.username;
    // res.status(200).json({ result });

    // console.log(user_password);
    id = result.usersInfo.userId;
    console.log(id);
    //emaile2=result.email;
  } else if (flag === 2) {
    var result = await user_information.findOne({
      where: { username: user_identifier },
      include: [{ model: user_pass }, { model: user_acc_type_ctrl }],
    });
    // res.status(200).json(result);
    user_password = result.usersPassword.password;
    role = result.usersAccountType.account_type;
    firstName = result.FirstName;
    middleName = result.MiddleName;
    userName = result.username;
    id = result.userId;
    console.log(id);
    // name=result.username
  }
  // res.json({message:`user password from the database:${user_password}`})
  //input password from the form; no need hashing the input password
  const input_password = req.body.password;
  bcrypt.compare(input_password, user_password, function (err, result) {
    // res.send(result)

    if (err) {
      console.log(`error msg: ${err}`);
      console;
    }
    if (result) {
      const payload = {
        id: id,
        role: role,
      };
      console.log(' jwtsecret.secret ',  jwtsecret.secret)
      jwt.sign(
        payload,
        jwtsecret.secret,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          return res.json({
            token: token,
            id: id,
            role: role,
            FirstName: firstName,
            MiddleName: middleName,
            userName: userName,
          });
        }
      );
    } else return res.status(200).json({ passwordFailure: 'incorrect password!.' });
  });
});
module.exports = router;
