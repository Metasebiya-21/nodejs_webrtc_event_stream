//zz
const user_information = require('../models/users.model');
const multer = require('multer');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const path = require('path');
var authorization = require('../middleware/authorization');
var authorization = require('../middleware/authorization');
const video_view_model = require('../models/video.views');
const video_title_model = require('../models/video.title');
const video_watch_model = require('../models/video.watch');
const videoViewes = require('../models/videoViewes');
//const video_upload_model  = require('../models/video.views')
//const video_format_model  = require('../models/video.format')
const video_feedback_model = require('../models/video.feedback');
//const video_download_model  = require('../models/video.downloaded')
const video_resolution_model = require('../models/video.resolution');
const video_information_model = require('../models/video.information');
const video_subscription_model = require('../models/video.subscription');
const video_feedbacks = require('../models/video.feedback');
const express = require('express');

const router = express.Router();
const fs = require('fs');
const { videoViews } = require('../models/usr_models');
const { check } = require('express-validator');
const videoStorage = multer.diskStorage({
  // Destination to store image
  destination: 'public/video',
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

  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(mp4|mkv|ts|mkv)$/)) {
      // upload only png and jpg format
      return cb(new Error('Please upload a video'));
    }
    cb(undefined, true);
  },
});
const imageStorage = multer.diskStorage({
  // Destination to store image
  destination: 'public/images',
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + path.extname(file.originalname)
    );
    // file.fieldname is name of the field (image)
    // path.extname get the uploaded file extension
  },
});
const imageUpload = multer({
  storage: imageStorage,

  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|JPG|jpg)$/)) {
      // upload only png and jpg format
      return cb(new Error('Please upload a Image'));
    }
    cb(undefined, true);
  },
});
router.get('/getAllTitle', async (req, res) => { 
  video_title_model 
    .findAll({order: [['updatedAt', 'DESC']], 
    }) 
    .then((result) => { 
      return res.json({ video: result }); 
    }) 
    .catch((err) => { 
      console.log(err); 
    }); 
})
router.post(
  '/uploadVideo',authorization.authenticateJWT,
  videoUpload.single('video'),
  async (req, res) => {
    console.log('nnnnn');
    const user = req.body.username;
    const filePath = req.file.path.split('\\').join('/');
    const videoFileName=req.file.filename;
    const result = await user_information.findOne({
      where: { username: user },
    });
console.log(result)
    if (!result) {
      res.status(200).send({ message: 'no user' });
    } 
    else {
      const thumbnialFilePath = req.body.thumbnialFilePath;
      console.log(thumbnialFilePath);
      const thumbnialFileName=req.body.thumbnialFileName
      console.log(thumbnialFileName)
      const user_id = result.userId;
      const categorey = req.body.categorie;
      const Title = req.body.Title; //video title
      const Descrieption = req.body.Descrieption;
      const video_subscription = req.body.subscrieptionType; // either free / paid
      const video_price = req.body.video_price;
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
          filePath: filePath,
          thumbnialFilePath: thumbnialFilePath,
          frame_per_second: video_fps,
          thumbnialFileName:thumbnialFileName,
          videoFileName:videoFileName,
          // userId: user_id,
          catagory:categorey
        })
        .then((result) => {
          video_title_model.create({
            Title: Title,
            video_id: result.video_id,
            Descrieption: Descrieption,
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
            usersInfoUserId: user_id,
            videoInfoVideoId: result.video_id,
          });
          video_view_model.create({
            video_id: result.video_id,
          });
          console.log(result);
          res.json({ resualt :result});
        })
        .catch((err) => {
          console.log(err);
        });
      //   })/
      
    }
  }
);
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


  const correctPath = videoPath.filePath;
  const imagePath=videoPath.thumbnialFilePath
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
        message:'delet the video scusses'
      });
    });
 const directory = path.join(process.cwd(),correctPath);
 const directoryImage=path.join(process.cwd(),imagePath)
  console.log(directory);
  try {
    fs.unlinkSync(directory);
    fs.urlinkSync(directoryImage)
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
      const root = path.dirname(
        'C:\\Users\\Alemgena\\Videos\\livestream\\backend\\public'
      );
      const directory = path.join(root, correctPath);
      console.log(directory);
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
router.post('/view/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  //const userId = req.body.user_id;
  const checke = await videoViews.findOne({  where: { video_id:videoId } });
if(!checke){
  videoViews
    .create({
      video_id: videoId,
      userId: userId,
    })
    .then((resualt) => {
      console.log(resualt)
      res.json(resualt);
    });
}
else{
  console.log('user is already view the video')
}
});
router.get('/getAllViews/:ID', async (req, res) => {
  const videoId=req.params.ID
  videoViewes
    .findAll({ where:{video_id:videoId},
      order: [['updatedAt', 'DESC']],
    })
    .then((result) => {
      res.json({data:result});
    })
    .catch((err) => {
      console.log(err);
    });
}); //getAllSubscriebe
router.get('/getAllVideo', async (req, res) => {
  video_information_model
    .findAll({order: [['updatedAt', 'DESC']],where:{catagory:'none'},
      include: [{ model: video_title_model },
        {  model:user_information
      }],
    })
    .then((result) => {
      return res.json({ video: result });
    })
    .catch((err) => {
      console.log(err);
    });
});
router.post('/getUserbyVideo/:id', async (req, res) => {
  const id=req.params.id
  video_information_model
    .findAll({ where:{video_id:id},
      include: [
        {
          model: user_information,
        },
      ],
    })
    .then((result) => {
      console.log(result);
      res.status(200).json({ users: result });
    });
});

router.get('/getVideoById/:id', async (req, res) => {
  var id = req.params.id;
console.log(id)
 console.log(process.cwd())

  video_information_model
    .findOne({
      where: { video_id: id },
      attributes: {
        exclude: ['createdAt'],
      },
      include: [
      
        { model: video_title_model },
     {model:user_information},
        { model: video_view_model },
        { model: video_subscription_model },
      ],
    })
    .then((result) => {
    // console.log(result);
    const correctPath=result.thumbnialFilePath

    const directory = path.join(process.cwd(),correctPath);
console.log(directory)
      res.status(200).json({ user: result });
     
    })
    .catch((err) => {
      console.log(err);
    });
});
//get the vidio order  by most like
router.get('/orderByLike', async (req, res) => {
  video_feedbacks
    .findAll({
      order: [['Likes', 'ASC']],
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
//'/getProfile/:id'
router.post(
  '/thumbnail',
  imageUpload.single('image'),
  (req, res) => {
    let imagePath = req.file.path.split('\\').join('/');
    let imageName = req.file.filename;
    // var regex = /\\/g;
    // process.cwd(imagePath).replace(regex, '/');
    if(!req.file.path){
      console.log('no file is upload')
    }
    console.log(imagePath);
    console.log(imageName);
    res.status(200).json({imagePath:imagePath,imageName:imageName});
  },
  (error, req, res, next) => {
    console.log(error);
    //  res.status(400).send({ error: error.message })
  }
);
module.exports = router;
