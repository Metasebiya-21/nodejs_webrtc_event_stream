const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var authorization = require('../middleware/authorization');
const advertiseModel = require('../models/advertiseModel');
const video_view_model = require('../models/video.views');
const video_title_model = require('../models/video.title');

const video_watch_model = require('../models/video.watch');
//const video_upload_model  = require('../models/video.views')
//const video_format_model  = require('../models/video.format')
const video_feedback_model = require('../models/video.feedback');
//const video_download_model  = require('../models/video.downloaded')
const video_resolution_model = require('../models/video.resolution');
const video_information_model = require('../models/video.information');
const video_subscription_model = require('../models/video.subscription');
var nodemailer = require('nodemailer');
const user_information_ctrl = require('../models/users.model.js');
const user_acc_type_ctrl = require('../models/usersAccountType.model.js');
const user_pass_ctrl = require('../models/usersPassword.model.js');
const user_address_ctrl = require('../models/usersAddress.model.js');
const documents = require('../models/documentModel');
const user_address = require('../models/usersAddress.model.js');
const video_catagory = require('../models/video_catagory');
const liveStreamUser=require('../models/liveStreamUsers')
const LiveEvent=require('../models/liveEvent');
const liveEvent = require('../models/liveEvent');
function validateEmail(email) {
  email_pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,4}$/;
  return email_pattern.test(email);
}

const videoStorage = multer.diskStorage({
  // Destination to store image
  destination: './public/videos',
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + path.extname(file.originalname)
    );
    // file.fieldname is name of the field (image)
    // path.extname get the uploaded file extension
  },
});
const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 1000 * 1024 * 1024, // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(mp4|mkv|ts|mkv)$/)) {
      // upload only png and jpg format
      return cb(new Error('Please upload a video'));
    }
    cb(undefined, true);
  },
});
router.delete('/deleteLiveEvent/:id',async(req,res)=>{
const Id=req.params.id
await liveEvent.destroy({where:{Id:Id}}).then((resualt)=>{
  console.log(resualt)
  res.json({data:resualt})
})
})
router.get('/getAllLiveEventForUser',async(req,res)=>{
  await liveEvent.findAll({ where: { [Op.and]: [{ Privielage:"Public"}, { status:"Live"}] }}).then((resualt)=>{
    console.log(resualt)
    res.json({data:resualt})
  })
})//({ order: [['updatedAt', 'DESC']]
router.get('/getAllLiveEvent',async(req,res)=>{
  await liveEvent.findAll({order:[['updatedAt','DESC']]}).then((resualt)=>{
    console.log(resualt)
    res.json({data:resualt})
  })
})
//    where: { [Op.and]: [{ video_id: req.params.id }, { user_id: Id }] },
router.get('/getAllPrivietLiveEvent/:privateId',async(req,res)=>{ 
  const privateId=req.params.privateId 
  await liveEvent.findAll({ where: { [Op.and]: [{eventId :privateId}, { status:"Live"}] }}).then((resualt)=>{ 
    console.log(resualt) 
    res.json({data:resualt}) 
  }) 
})

router.delete('/deleteLiveUser/:id', (req, res) => {
  const Id = req.params.id;
  console.log(Id)
  liveStreamUser
    .destroy({
      where: {userId: Id }, })
    .then(function (result) {
      return res.json({
        message: 'delet the user scusses',
      });
    });
    
});
router.put('/changeStatusLiveStream/:id',async(req,res)=>{
  const Id=req.params.id
  const status='live'
  options = { multi: true };
    var condition = { where: {userId : Id } };
    const data = { status: status };
    liveStreamUser.update(data, condition, options).then((resualt)=>{
      console.log(resualt)
      res.json({data:resualt})
    }).catch((err)=>{
      console.log(err)
    });
})//changeLiveEventStatus
router.put('/changeLiveEventStatus/:id',async(req,res)=>{
  const Id=req.params.id
  const status='Live'
  options = { multi: true };
    var condition = { where: {Id : Id } };
    const data = { status: status };
    liveEvent.update(data, condition, options).then((resualt)=>{
      console.log(resualt)
      res.json({data:resualt})
    }).catch((err)=>{
      console.log(err)
    });

})
router.put('/changeStatusNonLiveEvent/:id',async(req,res)=>{
  const Id=req.params.id
  console.log(Id)
  const status='Not_Live'
  options = { multi: true };
    var condition = { where: {Id : Id } };
    const data = { status: status };
    liveEvent.update(data, condition, options).then((resualt)=>{
      console.log(resualt)
      res.json({data:resualt})
    }).catch((err)=>{
      console.log(err)
    });
  
})
router.put('/changeStatusNonLive/:id',async(req,res)=>{
  const Id=req.params.id
  const status='Not_Live'
  options = { multi: true };
    var condition = { where: {userId : Id } };
    const data = { status: status };
    liveStreamUser.update(data, condition, options).then((resualt)=>{
      console.log(resualt)
      res.json({data:resualt})
    }).catch((err)=>{
      console.log(err)
    });
  
})
router.post('/creatStreamUser/:username',async(req,res)=>{
const userName=req.params.username
console.log(userName)
const check=await liveStreamUser.findOne({where:{username:userName}})
if(check){
  console.log("user is alrady exists")
  res.json({data:"user is already exist on the livesteream"})
}
else{
const resualt=await user_information_ctrl.findOne({where:{username:userName},
  include: [{ model: user_address_ctrl }]
})
console.log(resualt.usersAddress.email)
liveStreamUser.create({
  FirstName:resualt.FirstName,
  MiddleName: resualt.MiddleName,
  LastName: resualt.LastName,
  username: userName,
  email:resualt.usersAddress.email,
  phone:resualt.usersAddress.phone
}).then((data)=>{
  console.log(data)
  res.json({resualt:data})
}).catch((err) => {
  console.log(err);
});
}
})

router.get('/getAllLiveUser',async(req,res)=>{
  await liveStreamUser.findAll().then((resualt)=>{
    console.log(resualt)
    res.json({data:resualt})
  }).catch((err) => {
    console.log(err);
  });
})
router.get('/getLiveUserByName/:username',async(req,res)=>{
  const username=req.params.username
  await liveStreamUser.findOne({where:{username:username}}).then((resualt)=>{
    console.log(resualt)
    res.json({data:resualt})
  }).catch((err) => {
    console.log(err);
  });
})
router.post('/uploadVideo', videoUpload.single('video'), async (req, res) => {
  const user = req.body.username;
  const filePath = req.file.path;
  const result = await user_information.findOne({ where: { username: user } });
  if (!result) {
    res.status(200).send({ message: 'no user' });
  } else {
    //declare constants
    const user_id = result.user_id;
    const video_catagory = req.body.catagory;
    const sub_catagory = req.body.sub_catagory;
    const video_title = req.body.title; //video title
    const video_discription = req.body.video_discription;
    const video_subscription = req.body.video_subscription_type; // either free / paid
    const video_price = req.body.video_price;
    res.send(req.file);
    const video_duration = req.body.video_duration; //video length
    const video_fps = req.body.fps; //video fps
    const video_resolution = req.body.resolution; //videoresolution

    /*getVideioduration(filePath).then(function(duration){
  const hours=Math.floor(duration/60/60);
  const minut=Math.floor(duration/60)-(hours*60)
  const second=Math.floor(duration%60);
  let fullDuration = hour + ":" + minut + ":" + second */
    //var duration= await getVideioduration(filePath)
    video_information_model
      .create({
        video: filePath,
        uploadedBy: user,
        frame_per_second: video_fps,
        userId: user_id,
      })
      .then((result) => {
        video_title_model.create({
          title: video_title,
          video_id: result.video_id,
          discription: video_discription,
        });
        video_resolution_model.create({
          resolution: video_resolution,
          video_id: result.video_id,
        });
        video_subscription_model.create({
          video_id: result.video_id,
          subscription_type: video_subscription,
        });
   
        video_watch_model.create({
          userId: user_id,
          video_id: result.video_id,
        });
        video_view_model.create({
          video_id: result.video_id,
        });
      })
      .catch((err) => {
        console.log(err);
      });
    //   })
  }
});

router.get('/getAllUser', async (req, res) => {
  const resualt = await user_information_ctrl.findAll({
    attributes: {
      exclude: [],
    },
    include: [{ model: user_address_ctrl }, 
              { model: user_acc_type_ctrl,
              where:{[Op.not]:[{account_type:'admin'}]}}],
  });
  if (!resualt) {
    res.status(200).send('no data recored!.');
  } else {
    res.status(200).json({ users: resualt });
  }
});
//get the user by id
router.get('/getUser/:id', (req, res) => {
  var user_id = req.params.id;
  user_information_ctrl
    .findOne({
      where: { userId: user_id },
      include: [{ model: user_address_ctrl }, { model: user_acc_type_ctrl }],
    })
    .then((result) => {
      //console.log(result);
      if (result) {
        res.status(200).json({ users: result });
      } else {
        res.send({ message: 'no data' });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
//delet users by id
router.delete('/:id', (req, res) => {
  const Id = req.params.id;
  console.log(Id)
  user_information_ctrl
    .destroy({
      where: { userId: Id },
      include: [
        { model: user_address_ctrl, where: { user_id: Id } },
        { model: user_pass_ctrl, where: { user_id: Id } },
        { model: user_acc_type_ctrl, where: { user_id: Id } },
      ],
    })
    .then(function (result) {
      return res.json({
        message: 'delet the user scusses',
      });
    });
    
});
router.get('/getUserbyVideo', async (req, res) => {
  user_information_ctrl
    .findAll({
      include: [
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
//delete all users
router.delete('/deletAllUser', (req, res) => {
  user_information_ctrl.destroy({ truncate: { cascade: true } });
  user_address_ctrl.destroy({ truncate: { cascade: true } });
  user_pass_ctrl.destroy({ truncate: { cascade: true } });
  user_acc_type_ctrl.destroy({ truncate: { cascade: true } }).the((result) => {
    res.json({
      status: 1,
      data: result,
    });
  });
});
//upgread non-premium to Premium user
router.put('/upgread', async (req, res) => {
  const username = req.body.username;
  const remark = req.body.remark;
  var result = await user_information_ctrl.findOne({
    where: { username: username },
    include: [{ model: user_acc_type_ctrl }],
  });

  if (result) {
    var userID = result.userId;
    options = { multi: true };
    var condition = { where: { user_id: userID } };
    const d = { account_type: remark };
    user_acc_type_ctrl.update(d, condition, options);
    console.log('sucssssss');
    res.json({ resualt: result });
  }
});
router.get('/searchByEmailUserName/email', async (req, res) => {
  const search_string = req.body.search_string;
  //check the search string whether email or username
  var check = validateEmail(search_string);
  //email
  if (check) {
    var query = await user_address.findOne({
      where: { email: search_string },
      include: [
        {
          model: user_information_ctrl,
          include: [{ model: user_acc_type_ctrl }],
        },
      ],
    });
    if (Boolean(query)) {
      res.send(query);
    } else {
      res.send('user not found');
    }
  }
  //username
  else {
    var query = await user_pinformation_ctrl.findOne({
      where: { username: search_string },
      include: [{ model: user_address_ctrl }],
      include: [{ model: user_acc_type_ctrl }],
    });
    if (Boolean(query)) {
      res.send(query);
    } else {
      res.send('user not found');
    }
  }
});

router.post('/uploadVideo', videoUpload.single('video'), async (req, res) => {
  const user = req.body.username;
  const filePath = req.file.path;
  const result = await user_information.findOne({ where: { username: user } });
  if (!result) {
    res.status(200).send({ message: 'no user' });
  } else {
    //declare constants
    const user_id = result.user_id;
    const video_title = req.body.title; //video title
    const video_discription = req.body.video_discription;
    const video_subscription = req.body.video_subscription_type; // either free / paid
    const video_price = req.body.video_price;
    res.send(req.file);
    const LikeName = req.body.like;
    const video_duration = req.body.video_duration; //video length
    const video_fps = req.body.fps; //video fps
    const video_resolution = req.body.resolution; //videoresolution
    const like = 1;
    const dislkie = 1;
    const comment = 'it is nice';
    /*getVideioduration(filePath).then(function(duration){
      const hours=Math.floor(duration/60/60);
      const minut=Math.floor(duration/60)-(hours*60)
      const second=Math.floor(duration%60);
      let fullDuration = hour + ":" + minut + ":" + second 
   //var duration= await getVideioduration(filePath)*/
    video_information_model
      .create({
        video: filePath,
        uploadedBy: user,
        frame_per_second: video_fps,
        userId: user_id,
      })
      .then((result) => {
        video_title_model.create({
          title: video_title,
          video_id: result.video_id,
          discription: video_discription,
        });
        video_resolution_model.create({
          resolution: video_resolution,
          video_id: result.video_id,
        });
        video_subscription_model.create({
          video_id: result.video_id,
          subscription_type: video_subscription,
        });
      
        video_watch_model.create({
          userId: user_id,
          video_id: result.video_id,
        });
        video_view_model.create({
          video_id: result.video_id,
        });
        video_feedback_model.create({
          Likes: like,
          dislikes: dislkie,
          comments: comment,
          video_id: result.video_id,
          userName: LikeName,
        });
      })
      .catch((err) => {
        console.log(err);
      });
    //   })
  }
});
//update video

router.put(
  '/updateVideo/:id',
  videoUpload.single('video'),
  async (req, res) => {
    const id = req.params.id;
    const filePath = req.file.path;
    const video_discription = req.body.description;
    const video_title = req.body.title;
    const video_subscription = req.body.subscription;
    const condition = { where: { video_id: id } };
    const data = {
      video: filePath,
    };
    const options = { multi: true };
    const data1 = {
      title: video_title,
      discrieption: video_discription,
    };
    const data2 = {
      subscription_type: video_subscription,
    };
    video_information_model
      .update(data, condition, options)
      .then((resualt) => {
        video_subscription_model.update(data2, condition, options);
        video_title_model.update(data1, condition, options);
        console.log(resualt);
        res.status(200).json({ success: true });
      })
      .catch((err) => {
        console.log(err);
      });
  }
);

router.delete('/deletVideo/:id', async (req, res) => {
  const Id = req.params.id;
  const videoPath = await video_information_model.findOne({
    where: { video_id: Id },
  });
  const correctPath = videoPath.video;
  //console.log(correctPath)
  console.log(path);
  video_information_model
    .destroy({
      where: { video_id: Id },
      include: [
        { model: video_title_model, where: { video_id: Id } },
   
        { model: video_subscription_model, where: { video_id: Id } },
        { model: video_resolution_model, where: { video_id: Id } },
        { model: video_feedback_model, where: { video_id: Id } },
        { model: video_view_model, where: { video_id: Id } },
        { model: video_watch_model, where: { video_id: Id } },
      ],
    })
    .then(function (result) {
      res.json({
        data: result,
      });
    });
  const root = path.dirname('D:\\livestream\\backend\\public');
  const directory = path.join(root, correctPath);
  try {
    fs.unlinkSync(directory);
    //console.log('suucccc')
  } catch (err) {
    console.error(err);
  }
}); //D:\livestream\backend\public\videos
router.delete('/deletAllVideo', async (req, res) => {
  const p = await video_information_model.findAll();
  const correctPath = p.video;
  video_information_model
    .destroy({
      truncate: { cascade: true },
      include: [
        { model: video_title_model, truncate: { cascade: true } },
 
        { model: video_subscription_model, truncate: { cascade: true } },
        { model: video_resolution_model, truncate: { cascade: true } },
        { model: video_feedback_model, truncate: { cascade: true } },
        { model: video_view_model, truncate: { cascade: true } },
        { model: video_watch_model, truncate: { cascade: true } },
      ],
    })
    .then(function (result) {
      if (result.length == 0) {
        res.json({ data: 'no video' });
      }
      const root = path.dirname('D:\\livestream\\backend\\public');
      const directory = root + '/' + correctPath;
      try {
        fs.unlinkSync(directory);
        //file removed
      } catch (err) {
        console.error(err);
      }

      res.json({
        status: 1,
        data: result,
      });
    });
});
router.get('/getAllVideo', authorization.authenticateJWT, async (req, res) => {
  video_information_model
    .findAll({
      attributes: {
        exclude: ['createdAt'],
      },
      include: [
        { model: video_title_model, attributes: ['title', 'discription'] },
  
        { model: video_view_model, attributes: ['views'] },
        {
          model: video_feedback_model,
          attributes: ['Likes', 'dislikes', 'comments'],
        },
        { model: video_view_model, attributes: ['views'] },
      ],
    })
    .then((result) => {
      console.log(result);
      res.status(200).json({ user: result });
    })
    .catch((err) => {
      console.log(err);
    });
});
router.get('/getVideoById/:id', async (req, res) => {
  var id = req.params.id;
  video_information_model
    .findOne({
      where: { video_id: id },
      attributes: {
        exclude: ['createdAt'],
      },
      include: [
        { model: video_title_model, attributes: ['title', 'discription'] },
  
        { model: video_view_model, attributes: ['views'] },
        {
          model: video_feedback_model,
          attributes: ['Likes', 'dislikes', 'comments'],
        },
        { model: video_view_model, attributes: ['views'] },
      ],
    })
    .then((result) => {
      console.log(result);
      res.status(200).json({ user: result });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post('/createCatagory', async (req, res) => {
  const data = ({ catagorey_name, Description } = req.body);
  video_catagory
    .create({
      catagorey_name: data.catagorey_name,
      Description: data.Description,
    })
    .then((resualt) => {
      res.status(200).json({ data: resualt });
    })
    .catch((err) => {
      console.log(err);
    });
});
//get catagorey
router.get('/getCtagoreyById/:id', async (req, res) => {
  const id = req.params.id;
  const resualt = await video_catagory.findOne({ where: { id: id } });
  if (resualt) {
    res.status(200).json({ data: resualt });
  } else {
    res.send({ messages: 'no catagory' });
  }
});
router.get('/getAllCatagory', async (req, res) => {
  const resualt = await user_information_ctrl.findAll({
    attributes: {
      exclude: ['updatedAt', 'id'],
    },
  });
  if (resualt) {
    res.status(200).json({ data: resualt });
  } else {
    res.send({ messages: 'no data at all' });
  }
});
router.delete('/deletCatagoreyById/:id', async (req, res) => {
  const id = req.params.id;
  video_catagory
    .destroy({ where: { id: id } })
    .then((resualt) => {
      res.status(200).json({ data: resualt });
    })
    .catch((err) => {
      console.log(err);
    });
});
router.put('/edietCatagoreyById/:id', async (req, res) => {
  const id = req.params.id;
  const data = {
    // ,

    Description: req.body.Description,
    catagorey_name: req.body.catagorey_name,
  };
  var condition = { where: { id: id } };
  options = { multi: true };
  video_catagory
    .update(data, condition, options)
    .then((resualt) => {
      res.status(200).json({ data: resualt });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post('/adminPasswordSend',async(req,res)=>{ 
  const emaile=req.body.emaile 
  const Newpassword=req.body.password 
 
  const resualt=await user_address_ctrl.findOne({where:{email:emaile}, 
    include: [ 
      { 
        model: user_information_ctrl, 
        include: [{ model: user_pass_ctrl }, { model: user_acc_type_ctrl }], 
      }, 
    ], 
  }) 
   
if(resualt){ 
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
    to: emaile, 
    subject: 'Email verification.', 
    html: 
      '<h1>Welcome</h1><p>This is the New Password:</p>' + 
      Newpassword  
     
  }; 
  transporter.sendMail(mailOptions, function (error, info) { 
    if (error) { 
      console.log(error); 
    } else { 
      console.log('Email sent: ' + info.response); 
    } 
  }); 
   
  const data = { 
    password: bcrypt.hashSync(Newpassword,10) 
  }; 
  let user_password = resualt.usersInfo.usersPassword.password; 
  var condition = { where: { password: user_password } }; 
  const options = { multi: true } 
  user_pass_ctrl 
        .update(data, condition, options) 
        .then((result) => { 
          console.log(result); 
       
        
          res.json({ message: 'send password is success' }); 
        }) 
        .catch((err) => { 
          console.log(err); 
        }); 
} 
else{ 
  res.json({message:"Incorrect Emaile"}) 
} 
})

module.exports = router;
