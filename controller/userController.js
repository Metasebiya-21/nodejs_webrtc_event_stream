const express = require('express');
const sequelize = require('../util/database');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
var nodemailer = require('nodemailer');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const auth = require('../middleware/auth');
const user_information_ctrl = require('../models/users.model.js');
const user_acc_type_ctrl = require('../models/usersAccountType.model.js');
const user_pass_ctrl = require('../models/usersPassword.model.js');
const user_address_ctrl = require('../models/usersAddress.model.js');
const jwt = require('jsonwebtoken');
const video_view_model = require('../models/video.views');
const video_title_model = require('../models/video.title');
const videoSubscriebed = require('../models/videoSubscriebed');
const privateUser = require('../models/PrivatUsers')
//const video_price_model  = require('../models/video.price')
//const video_watch_model  = require('../models/video.watch')
//const video_upload_model  = require('../models/video.views')
//const video_format_model  = require('../models/video.format')
//const video_feedback_model  = require('../models/video.feedback')
//const video_download_model  = require('../models/video.downloaded')
//const video_resolution_model  = require('../models/video.resolution')
//const video_information_model  = require('../models/video.information')
const video_subscription_model = require('../models/video.subscription');
//const video_feedbacks = require('../models/video.feedback')
const liveEvent = require('../models/liveEvent');
const searchModel = require('../models/searcheModel');
const videoFavoriet = require('../models/videoFavoriet');
const videoCart = require('../models/cartModel');
const video_like = require('../models/video_like');
const video_information = require('../models/video.information');
const video_comment = require('../models/video_comment');
const User = require('../models/users.model.js');
var authorization = require('../middleware/authorization');
const console = require('console');

const videoSubscrieber = require('../models/videoSubscriebed');
const video_subscription = require('../models/video.subscription');

const { check } = require('express-validator');
const {jwtsecret} = require('../config/jwt');


/*
const videoStorage = multer.diskStorage({
  /*Destination to store image     
  destination: './public/videos', 
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now() 
           + path.extname(file.originalname))
          // file.fieldname is name of the field (image)
          // path.extname get the uploaded file extension
  }
});
const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 1000*1024*1024 // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(mp4|mkv|ts|mkv)$/)) { 
       // upload only png and jpg format
       return cb(new Error('Please upload a video'))
     }
   cb(undefined, true)
}
});*/
router.post('/register', async (req, res) => {
  var code = (Math.floor(Math.random() * 10000000) + 10000000)
    .toString()
    .substring(1);
  //validate email and username
  const check_1 = await user_address_ctrl.findOne({
    where: { email: req.body.email },
  });
  const check_2 = await user_information_ctrl.findOne({
    where: { username: req.body.username },
  });
  //N.B: Boolean() returns false for null values in js
  if (Boolean(check_1)) {
    res.json({ message: 'email already exists' });
  } else if (Boolean(check_2)) {
    res.json({ message: 'username already exists' });
  } else {
    //user informationconsco
    const account_type = req.body.account_type;
    const Account_Status = req.body.Account_Status;
    const FirstName = req.body.FirstName;
    const MiddleName = req.body.MiddleName;
    const LastName = req.body.LastName;
    const username = req.body.username;
    const sex = req.body.sex;
    const BirthDate =req.body.BirthDate
    const age = req.body.age;
    const email = req.body.email;
    const phone = req.body.phone;
    const user_password = bcrypt.hashSync(req.body.password, 10); //encypt the password in the DB
    const expiresIn = 24 * 60 * 60 * 1000;
    payload = { code };
    const accessToken = jwt.sign(payload, jwtsecret.secret, {
      expiresIn: expiresIn,
    });
    console.log(FirstName,MiddleName,LastName)
    var dateObj = new Date(BirthDate);
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

 let newdate = year + "/" + month + "/" + day;
 console.log(newdate)
    //check for errorsMIdd
    user_information_ctrl
      .create({
        FirstName: FirstName,
        MiddleName: MiddleName,
        LastName: LastName,
        username: username,
        sex: sex,
        Account_Status:Account_Status,
        Activation_code: code,
        Activation_token: accessToken,
        //  Account_Status: account_satatus,
      })
      .then((result) => {
        user_address_ctrl.create({
          phone: phone,
          email: email,
       
          user_id: result.userId,
        });
        console.log(phone);
        user_pass_ctrl.create({
          password: user_password,
          user_id: result.userId,
        });
        user_acc_type_ctrl.create({
          user_id: result.userId,
          account_type:account_type
        });

        //store the generated token in the database
        //  user_information_ctrl.update({Activation_token:accessToken},
        //   {where:{username:user_name}});
        //send email to the user
        //https://ethiolive.net3001/#/movies
        const host = req.get('host');
        var link = 'https://ethiolive.net/verify/' + code;
        var transporter = nodemailer.createTransport({
          service: 'Gmail',
          secure: true,
          auth: {
            user: 'metasebiya8@gmail.com',
            pass: 'pass',
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        var mailOptions = {
          from: 'metasebiya8@gmail.com',
          to: email,
          subject: 'Email verification.',
          html:
            '<h1>Welcome</h1><br> Please Click on the link to verify your email.<br><a href=' +
            link +
            '>Click here to verify</a>',
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
        res.status(200).json({ data: result });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});
//get the user by id , 
console.log(authorization.authenticateJWT)
router.get(
  '/getProfile/:id',authorization.authenticateJWT,
async  (req, res) => {
  console.log('errorfffffffffffff')
    var user_id = req.params.id;
 const resualt= await user_information_ctrl
      .findOne({
        where: { userId: user_id },
        include: [
          { model: user_address_ctrl },
          { model: user_pass_ctrl },
          { model: user_acc_type_ctrl },
        ],
      })
;
if(resualt){  
  console.log(resualt)
    res.json({ User: resualt });
      }
    
    else{
      res.json({User:"Token is not valid"})
    }
  }
);
//edite the user by id
router.put('/editUser/:id', async (req, res) => {
  var code = (Math.floor(Math.random() * 10000) + 10000)
    .toString()
    .substring(1);
  var statuss = 0;
  const user_id = req.params.id;
  console.log(req.body.FirstName);
  const data = {
    FirstName: req.body.FirstName,
    MiddleName: req.body.MiddleName,
    LastName: req.body.LastName,
  };
  console.log(data.FirstName);
  var condition = { where: { userId: user_id } };
  console.log(user_id);
  const options = { multi: true };
  user_information_ctrl
    .update(data, condition, options)
    .then((upresult) => {
      const d = {
        phone: req.body.phone,
      };

      var condition1 = { where: { user_id: user_id } };

      user_address_ctrl.update(d, condition1, options);
      console.log(upresult);
      return res.status(200).json({ success: true });
    })
    .catch((err) => {
      console.log(err);
    });
});
//delete by id
router.delete('/:id', (req, res) => {
  const user_Id = req.params.id;
  user_information_ctrl
    .destroy({ where: { userId: user_Id } })
    .then(function (result) {
      user_address_ctrl.destroy({ where: { user_id: user_Id } });
      user_pass_ctrl.destroy({ where: { user_id: user_Id } });
      user_acc_type_ctrl.destroy({ where: { user_id: user_Id } });
      res.json({
        status: 1,
        data: result,
      });
    });
});
router.get('/verify/:code', async (req, res) => {
  console.log(req.protocol + ':/' + req.get('host'));
  console.log('domain is matched,Information is from authentic email');
  const code = req.params.code;
  var query = await user_information_ctrl.findOne({
    include: [{ model: user_address_ctrl }],
  });
  if (!Boolean(query)) {
    res.status(200).json({ Notverified: 'code not correct!.' });
  } else {
    token = query.Activation_code;
    jwt.verify(token,jwtsecret.secret, function (err, decoded) {
      if (err) {
        console.log('the code is expired');
      }
      user_information_ctrl
        .update(
          { Account_Status: 'active' },
          { where: { Activation_code: code } }
        )
        .then((resualt) => {
          if (resualt) {
            res.status(200).json({ verify: 'email is verified!' });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
});
//get the verify code
router.get('/activate_account', async (req, res) => {
  const activation_code = req.body.activation_code;
  var query = await user_information_ctrl.findOne({
    where: { Activation_code: activation_code },
    include: [{ model: user_address_ctrl }],
  });
  if (!Boolean(query)) {
    res.status(200).json({ Notverified: 'code not correct!.' });
  }
  // query the token that stored on the database by the activation code
  else {
    token = query.Activation_token;
    const user_email = query.usersAddress.email;
    // //verify whether the token is expired or not
    jwt.verify(token, jwtsecret.secret, function (err, decoded) {
      var transporter = nodemailer.createTransport({
        service: 'Gmail',
        secure: true,
        auth: {
          user: 'metasebiya8@gmail.com',
          pass: 'pass',
        },
      });
      var mailOptions = {
        from: 'metasebiya8@gmail.com',
        to: user_email,
        subject: 'Email verification.',
        html: `<pre>
                      <h1>Congratulations</h1><per>
                      your account has been activated sucessfully: Login to your account
                      <a href='https://ethiolive.net8080/LogIn.html'>LogIn</a>
                      </pre>`,
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      user_information_ctrl
        .update(
          { Account_Status: 'active' },
          { where: { Activation_code: activation_code } }
        )
        .then((resualt) => {
          if (resualt) {
            console.log('update account status true');
          }
        });
    });
  }
});
//upload video

//get the video by most liked
/*
router.get("/orderByLike", async (req, res) => {
  video_feedback_model
    .findAll({
      order: [["Likes", "ASC"]],
      attributes: { exclude: ["createdAt"] },
      include: [{ model: video_information_model, attributes: ["video"] }],
    }).then((resualt) => {
      if (resualt) {
        res.status(200).json({ data: resualt });
      } else {
        res.send("no more data");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});*/
//get the movie by most view
router.get('/orderByMostViews', async (req, res) => {
  video_view_model
    .findAll({
      order: [['views', 'ASC']],
      attributes: { exclude: ['createdAt'] },
      include: [{ model: video_information_model, attributes: ['video'] }],
    })
    .then((resualt) => {
      if (resualt) {
        res.status(200).json({ data: resualt });
      } else {
        res.send('no more data');
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
/*get catagorey by id
    router.get('/getCtagoreyById/:id',async(req,res)=>{
      const id=req.params.id;
      const  resualt=await video_catagory.findOne({where:{id:id}})
      if(resualt){
          res.status(200).json({data:resualt})
      }
      else{
          res.send({messages:"no catagory"})
      }
  })
  //get all catagorey
  router.get('/getAllCatagory',async(req,res)=>{
      const resualt=await user_information_ctrl.findAll({ attributes: {
          exclude: [  'updatedAt','id']},
      })
      if(resualt){
          res.status(200).json({data:resualt});
      }
      else{
          res.send({messages:"no data at all"})
      }
  });*/
//add to the favoriet
router.post('/addToFavoriet/:id', async (req, res) => {
  const Id = req.body.user_Id;
  const video_id = req.params.id;
  let favoriet = await videoFavoriet.findOne({
    where: { [Op.and]: [{ video_id: req.params.id }, { user_id: Id }] },
  });
  if (!favoriet) {
    videoFavoriet
      .create({
        video_id: req.params.id,
        userId: Id,
      })
      .then((resualt) => {
        console.log('video is add to the favorie list');
        res.json({ success: resualt });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    videoFavoriet.destroy({
      where: { [Op.and]: [{ video_id: req.params.id }, { user_id: Id }] },
    });
    console.log('video is remove from the favorite');
    res.status(200).json({
      message:
        'remove from the favoriet but still no you can find in the system',
    });
  }
});
router.post('/addToSubscrieber/:id', async (req, res) => {
  const Id = req.body.user_Id;
  const usersubId=req.body.userSubId
  console.log(usersubId)
  const video_id = req.params.id;
  let subscrieb = await videoSubscrieber.findOne({
    where: { [Op.and]: [{ video_id: req.params.id }, { user_id: Id }] },
  });
  if (!subscrieb) {
    videoSubscrieber
      .create({
        video_id: req.params.id,
        userId: Id,
        userSubscriebId:usersubId
      })
      .then((resualt) => {
        console.log('video is add to the  subschribe');
        res.json({success: resualt});
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.json({message:"unsubscriebe"})
  }
});

router.delete('/deletSubscriebe/:video_id/:userId',async(req,res)=>{
  const Id = req.params.userId;
  const video_id = req.params.video_id;
  console.log(Id)
  console.log(video_id)
  videoSubscrieber.destroy({
    where: { [Op.and]: [{ video_id:video_id}, { user_id: Id }] }
  }).then((response)=>{
    console.log(response)
    res.json(response)
  });
})
router.get('/getAllUserSubscriebe/:id', async (req, res) => {
  const id = req.params.id;
  videoSubscrieber
  .findAll({ where:{userSubscriebId:id},
    order: [['updatedAt', 'DESC']],
  })
  .then((result) => {
   console.log(result)
   return res.json({subscrieb:result});
  })
  .catch((err) => {
    console.log(err);
  });
});
router.get('/getAllUserSubscriebeed/:id', async (req, res) => {
  console.log('njkxbzhjbjhbvakjbvbvKJWEB')
  const id = req.params.id;
  videoSubscrieber
  .findAll({ where:{userId:id},
    order: [['updatedAt', 'DESC']],
  })
  .then((result) => {
   console.log(result)
   return res.json({subscrieb:result});
  })
  .catch((err) => {
    console.log(err);
  });
});
router.get('/getAllSubscriebe/:video_id', async (req, res) => {
  const video_id = req.params.video_id;
  const subschriebeCounter = await videoSubscrieber.count(video_id);
  const videoId=req.params.video_id
  videoSubscrieber
  .findAll({ where:{video_id:videoId},
    order: [['updatedAt', 'DESC']],
  })
  .then((result) => {
   console.log(result)
   return res.json({subscrieb:result});
  })
  .catch((err) => {
    console.log(err);
  });
});
// get favoriet list
router.get('/getFavorietList/:user_id', async (req, res) => {
  const user_id = req.params.user_id;

  await videoFavoriet
    .findAll({
      where: { user_id: user_id },
      include: [{ model: video_information ,
      include:[{
model:video_title_model
      }]
       } ],
    })
    .then((resualt) => {
      if (resualt) {
        res.status(200).json({ data: resualt });
      } else {
        res.send('no data more');
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
//remov from  favoriet list
router.get('/removeFromFvorietList/:id', async (req, res) => {
  const id = req.params.id;
  videoFavoriet
    .destroy({ where: { video_id: id } })
    .then((resualt) => {
      console.log(resualt);
      res.status(2000).json({ video: 'remove from the favorit' });
    })
    .catch((err) => {
      console.log(err);
    });
});
//create chart 0977010779
router.post('/creatCart', async (req, res) => {
  console.log(req.body.length);
  for (let i = 0; i < req.body.length; i++) {
    const user_id = JSON.stringify(req.body[i].user_id);
    const quantity = JSON.stringify(req.body[i].quantity);
    const video_id = JSON.stringify(req.body[i].video_id);
    //delet the prevows cart
    console.log(user_id);
    console.log(quantity);
    console.log(video_id);
    const resualt = await videoCart.findOne({
      where: { userId: user_id, video_id: video_id },
    });
    if (resualt) {
      videoCart.destroy({ where: { userId: user_id } });
      console.log('car is deleted');
      return res.json({ status: 'the cart is already' });
    } else {
      videoCart
        .create({
          userId: user_id,
          video_id: video_id,
          quantity: quantity,
        })
        .then((resualt) => {
          console.log(resualt);
          return res.json({ status: resualt });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
});
//get cart user id
router.get('/getCart/:userID', (req, res) => {
  const user_id = req.params.userID;
  videoCart
    .findAll({ where: { userId: user_id } })
    .then((resualt) => {
      if (resualt) {
        res.status(200).json({ data: resualt });
      } else {
        res.status(200).json({ message: 'no cart' });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
router.delete('/deleteCart/:userID', (req, res) => {
  const user_id = req.params.userID;
  videoCart
    .destroy({ where: { userId: user_id } })
    .then((resualt) => {
      if (resualt) {
        res.status(200).json({ data: resualt });
      } else {
        res.status(200).json({ message: 'no cart' });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
//ediet cart
router.put('/edietCart/:id', (req, res) => {
  const id = req.params.id;
  const quantity = req.body.quantity;
  const user_id = req.body.user_id;
  const video_id = req.body.vide_id;
  const data = {
    quantity: quantity,
    user_id: user_id,
    video_id: video_id,
  };
  var condition = { where: { id: id } };
  options = { multi: true };
  videoCart.update(data, condition, options).then((resualt) => {
    if (resualt) {
      res.status(200).json({ upadate: true });
    } else {
      res.status(200).json({ upadate: false });
    }
  });
});
//insert into search history
router.post('/createSearchHistory', async (req, res) => {
  const userId = req.body.userID;
  const searchName = req.body.searchName;
  const resualt = await searchModel.findAll({where:{searchName:searchName}})
  if(resualt){
searchModel.destroy({where:{searchName:searchName}}).then((resualt)=>{
    console.log(resualt)
    searchModel
    .create({
      userId: userId,
      searchName: searchName,
    })
    .then((data) => {
      console.log(data);
      res.status(200).json({ success: true });
    })
    .catch((err) => {
      console.log(err);
    });
  })
  }
  else{
  searchModel
    .create({
      userId: userId,
      searchName: searchName,
    })
    .then((data) => {
      console.log(data);
      res.status(200).json({ success: true });
    })
    .catch((err) => {
      console.log(err);
    });
  }
});
//get search history
router.get('/getSearchHistory/:id', async (req, res) => {
  const id = req.params.id;
 const resualt=await searchModel.findOne({ where: { userId: id } });
 console.log(resualt)
 if(resualt){
  const searchName=resualt.searchName
 await video_title_model.findAll({where:{Title:searchName},order: [['updatedAt', 'DESC']],
  include:[
    {
    model:video_information
    }
  ]
}).then((data)=>{
console.log(data)
res.status(200).json({ resualt: data });
})
 }

});
router.post(
  '/likes/:id',
  async (req, res, next) => {
    const VideoId = req.params.id;
    console.log(VideoId);
    const Id = req.body.userID;
    console.log(Id);
    //const VideoId = req.params.id;
    console.log(VideoId);
    const resualt = await video_information.findOne({
      where: { video_id: VideoId },
    });

    if (!resualt)
      return res
        .status(404)
        .send({ message: 'video cannot be found or has been removed' });

    let like = await video_like.findOne({
      where: { [Op.and]: [{ video_id: req.params.id }, { user_id: Id }] },
    });

    if (!like) {
      let newLike = await video_like.create({
        user_id: Id,
        video_id: req.params.id,
      });
      console.log(newLike)
      console.log('video is like')
      return res.json({data:newLike});
    } else {
      console.log('viedeo already liked');
      return res.status(400).json({ msg: 'video already liked' });
    }
  }
);
router.delete('/unlikes/:id', async (req, res, next) => {
  const Id = req.body.userID;
  console.log(Id);
  const VideoId = req.params.id;
  const resualt = await video_information.findOne({
    where: { video_id: VideoId },
  });
  if (!resualt) {
    return res
      .status(404)
      .send({ message: 'video cannot be found or has been removed' });
  }
  let like = await video_like.findOne({
    where: { [Op.and]: [{ video_id: req.params.id }] },
  });

  if (like) {
    await video_like.destroy({
      where: { video_id: req.params.id }
    });
    console.log('like is deleted');
    res.json({data:like});
  } else {
    console.log('nnnnnnn');
    return res.status(400).json({ msg: 'video already uliked' });
  }
});
router.get('/commentsCounter/:id', async (req, res) => {
  const id = req.params.id;
  const commentsCounter = await video_comment.count(id);

  res.json({ commentsCounter });
  console.log('commentsCounter', commentsCounter);
});
router.post('/comment', async (req, res) => {
  const Id = req.body.userId;
  console.log(Id);
  const VideoId = req.body.video_id;
  const text = req.body.text;
  const resualt = await video_information.findOne({
    where: { video_id: VideoId },
  });

  if (!resualt) {
    return res
      .status(404)
      .send({ message: 'video cannot be found or has been removed' });
  }
  let user = await user_information_ctrl.findOne({
    where: { userId: Id },
  });

  if (user) {
    const name = user.FirstName;
    let newComment = await video_comment.create({
      text: text,
      user_id: req.body.userId,
      video_id: VideoId,
      name: name,
    });
   // console.log(newComment);
    return res.json({data:newComment});
  }
});
//getAllLike
router.get('/getAllLike/:video_id', async (req, res) => {
  const videoId=req.params.video_id
  video_like
  .findAll({ where:{video_id:videoId},
    order: [['updatedAt', 'DESC']],
  })
  .then((result) => {
   console.log(result)
   return res.json({licke:result});
  })
  .catch((err) => {
    console.log(err);
  });
}); 
router.get('/getAllVideoComment/:video_id', async (req, res) => {
  const video_id = req.params.video_id;
  
  const commentCounter = await video_comment.count(video_id);

  res.json({ commentCounter });
  console.log('commentCounter', commentCounter);
}); 
//getAllSubscriebe
router.get('/getAllComment/:id', async (req, res) => {
  const videoId=req.params.id
  video_comment
    .findAll({ where:{video_id:videoId},
      order: [['updatedAt', 'DESC']],
    })
    .then((result) => {
     // console.log(result)
     return res.json({comment:result});
    })
    .catch((err) => {
      console.log(err);
    });
});
router.delete('/deleteComment/:id', async (req, res) => {
  const video_id = req.params.id;
  //const userId = req.params.userId;
  const resualt = await video_comment.findOne({
    where: { video_id: video_id },
  });
  // const Idone = resualt.user_Id;
  if (resualt) {
    video_comment.destroy({ where: { video_id: video_id } });
  }
});
//getthe user by order of posting the video
router.get('/getUserbyVideo', async (req, res) => {
  
  const chek=await user_acc_type_ctrl.findAll()
  const nonPerimum=chek.account_type
  console.log(check)
  user_information_ctrl
    .findAndCountAll({
      include: [
        { model: user_address_ctrl }, 
        { model: user_acc_type_ctrl,
          where:{[Op.not]:[{account_type:'admin'}]}},
        {
          model: video_information,
          include: [
            { model: video_title_model },
            { model: video_subscription_model },
          ],
        },
      ],
    })
    .then((result) => {
      console.log(result);
      res.status(200).json({ users: result });
    });
});
router.get('/getUserbyVideo/:id', async (req, res) => {
   const userId=req.params.id
  user_information_ctrl
    .findOne({where:{userId:userId},
      include: [
        {
          model: video_information,
          include:[
            {
              model:video_title_model
            }
          ]
  
        },
      ],
    })
    .then((result) => {
      console.log(result);
      res.status(200).json({ users: result });
    });
});
router.get('/getVideoByUser', (req, res) => {
  user_information_ctrl
    .findAll({
      attributes: [
        [
          sequelize.literal(
            '(SELECT COUNT(*) FROM videoinfos WHERE video_watch.user_id = usersInfo.userId)'
          ),
          'PostCount',
        ],
      ],
      order: [[sequelize.literal('PostCount'), 'DESC']],
    })
    .then((resualt) => {
      console.log(resualt);
    });
});

//find by date

router.get('/searchVideoByTitle/:Title',async(req,res)=>{
const Title=req.params.Title
const resualt=await video_title_model.findAll({where:{Title:Title},
include:[
  {model:video_information}
]
})

  console.log(resualt)
  res.status(200).json({ users: resualt });

})
router.get('/getVideoByCategoriey/:Name',async(req,res)=>{
  const Name=req.params.Name
  video_information.findAll({where:{catagory:Name},
    include: [
      { model: video_title_model },]
  }).then((resualt)=>{
    console.log(resualt)
    res.json({data:resualt})
  })
})
router.post('/createEvent',async(req,res)=>{
const status='Not_Live'
  const Producer=req.body.Producer
  const EventName=req.body.EventName
  const eventId = req.body.eventId
  const Prievleg=req.body.Prievielage
  const Descrieption=req.body.Descrieption
  liveEvent.create({
    producer:Producer,
    eventName:EventName,
    eventID: eventId,
    Privielage:Prievleg,
    descrieption:Descrieption,
    status:status
    }).then((resualt)=>{
      
    console.log(resualt)
    })
})
router.get('/EventUser/:eventName',async(req,res)=>{
  const EventName=req.params.eventName
  liveEvent.findOne({
    where:{eventName:EventName}
  }).then((resualt)=>{
console.log(resualt)
res.json({resualt:resualt})
  })

})
router.post('/createId/:eventName',async(req,res)=>{
  const eventName=req.params.eventName
  const eventId=req.body.eventId
  await liveEvent.create({eventId:eventId})
})
router.post('/createUser',async(req,res)=>{
  console.log(req.body)
  for (let i = 0; i < req.body.length; i++) {
    const  userName= req.body[i].name
    const eventId=req.body[i].eventIdd
    const check=await privateUser.findOne({   where: { [Op.and]: [{ userName: userName }, { eventID: eventId }] }})
console.log(eventId)
if(check){
  res.json({resualt:"user is already exist"})

  }
  else{
    await  privateUser.create({
      userName:userName,
      eventID:eventId
          }).then((resualt)=>{
            console.log(resualt);
          }).catch((err)=>{
            console.log(err)
              })
  }
}
})
  router.get('/getAllPrivatUser/:userName/:eventId',async(req,res)=>{
    const userName=req.params.userName
    const eventId=req.params.eventId
    console.log(eventId)
  const resualt= await privateUser.findOne({where:{ [Op.and]: [{ userName: userName }, { eventID: eventId }] }})
      if(resualt){
       console.log(resualt )
        res.json({resualt:"user is exists"})
      }
      else{
        res.json({resualt :"more data:"})
      }
  })
router.get('/getPrivatUser',async(req,res)=>{
  await privateUser.findAll().then((resualt)=>{
res.json({resualt:resualt})
  })
})
router.get('/deletegetPrivatUser/:userName',async(req,res)=>{
  
  await privateUser.destroy({where:{userName:req.params.userName}}).then((resualt)=>{
res.json({resualt:resualt})
  })
})
module.exports = router;
