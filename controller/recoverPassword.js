const express = require('express');
const router = express.Router();
const user_password = require('../models/usersPassword.model.js');
const user_address = require('../models/usersAddress.model');
const user_information = require('../models/users.model');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

function validateEmail(email) {
  email_pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,4}$/;
  return email_pattern.test(email);
}
var id;
router.post('/sentEmail', async (req, res) => {
  //identify whether the user input's username or email
  var email = req.body.email;
  check = validateEmail(email);
  var code = (Math.floor(Math.random() * 10000000) + 10000000)
    .toString()
    .substring(1);
  if (check) {
    var query;
    query = await user_address.findOne({
      where: { email: email },
      include: [
        { model: user_information, include: [{ model: user_password }] },
      ],
    });
    var user = query.usersInfo.username;
    id = query.usersInfo.userId;
    if (Boolean(query)) {
      var transporter = nodemailer.createTransport({
        service: 'Gmail',
        secure: true,
        auth: {
          user: 'alemgenateferi1@gmail.com',
          pass: '0930869450',
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      var mailOptions = {
        from: 'alemgenateferi1@gmail.com',
        to: email,
        subject: 'Email verification.',
        html:
          '<h1>Welcome</h1><p>This is the Activation code:</p>' +
          code +
          "<p><a href=''>click Here to activate</p>",
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      const data = {
        Activation_code: code,
      };
      var condition1 = { where: { username: user } };
      const options = { multi: true };
      user_information
        .update(data, condition1, options)
        .then((result) => {
          console.log(result);
          res.status(200).json({ message: 'send activation code is success' });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      res.json({ message: 'incorrect email' });
    }
  }
  //username
  /*  else{
        var query;
            query = await user_information.findOne({where:{username:user_identifier},
                include:[{model:user_address}]})
                const email=query.usersAccountType.email
                id=query.userId
            if (Boolean(query)){
                var transporter = nodemailer.createTransport({service:'Gmail',secure: true,
                auth: {
                        user: 'metasebiya42@gmail.com',
                        pass: 'dream2change',
                    },
                    });
        var mailOptions = {
                    from: 'metasebiya42@gmail.com',
                    to: email,
                    subject: 'Email verification.',
                    html:
                    '<h1>Welcome</h1><p>This is the Activation code:</p>' +
                    code +
                    "<p><a href=''>click Here to activate</p>"
                    };
        transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                }
                else {

                    console.log('Email sent: ' + info.response);
                }
            })
            }
            
        else{
            res.json({message:'incorrect username entry'})
        }
        const data={
            activation_conde:code
          }
          var condition1={ where :{username: user_identifier} };
      
          user_information.update(data, condition1 , options)
          .then((result)=>{
              res.status(200).json({sucss:true})
              console.log(result)
          }).catch((err)=>{
              console(err)
          })
    }*/
});
router.get('/getCode', async (req, res) => {
  const code = req.body.activation_conde;
  const qury = await user_information.findOne({
    where: { activation_conde: code },
  });
  if (qury) {
    res.status(200).json({ verify: 'get code correctly' });
  } else {
    res.status(200).json({ Notverified: 'email not verified!.' });
  }
});
router.post('/recoverPassword', async (req, res) => {
  const email = req.body.email;
  const code = req.body.activationCode;
  const query = await user_information.findOne({
    where: { Activation_code: code },
  });
  console.log(query);
  const id = query.userId;
  if (query) {
    const new_password = bcrypt.hashSync(req.body.password, 10);
    console.log(req.body.password);
    user_password
      .update({ password: new_password }, { where: { user_id: id } })
      .then((resualt) => {
        res.status(200).json({ resualt: 'password updated succssfuly' });
        console.log(resualt);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.status(200).json({ resualt: 'incorrect activation code' });
  }
});

//reset password

router.get('/changePassword', async (req, res) => {
  //console.log(`found password @ reset_password: ${password}`)
  console.log(req.body);
  const email = req.body.email;
  const CurrentPassword = req.body.currentPassword;
  console.log(CurrentPassword);
  console.log(email);
  const new_password = bcrypt.hashSync(req.body.newPassword, 10);
  console.log(email, new_password, CurrentPassword);
  var result = await user_address.findOne({
    where: { email: email },
    include: [
      {
        model: user_information,
        include: [{ model: user_pass, where: { password: CurrentPassword } }],
      },
    ],
  });
  if (result) {
    console.log('passowrd is changd');
    return res.status(200).json({ resualt: 'Invalid credentials!.' });
  } /* else {
    var password = result.usersInformation.usersPassword.password;
    user_password
      .update({ password: new_password }, { where: { password: password } })
      .then((data) => {
        if (data) {
          return res
            .status(200)
            .json({ password: 'password successfuly updated!' });
        } else {
          return res
            .status(200)
            .json({ CurrentPassword: 'Incorrect Current Password!.' });
        }
      });
  }*/
});
module.exports = router;
