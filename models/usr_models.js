const User = require('../models/users.model');
const accountType = require('../models/usersAccountType.model');
const userAddress = require('../models/usersAddress.model');
const userPassword = require('../models/usersPassword.model');
const video_information = require('../models/video.information');
const video_title = require('../models/video.title');
//const video_format = require('../models/video.format')
const video_resolution = require('../models/video.resolution');
const video_feedbacks = require('../models/video.feedback.js');
const video_price = require('../models/video.price');
const video_subscription = require('../models/video.subscription');
//const video_upload = require('../models/video.uploaded')
const video_watch = require('../models/video.watch');
const user_model_assoc = require('../models/model.association.js');
const documentModel = require('../models/documentModel');
const advertiseModel = require('../models/advertiseModel');
const searchModel = require('../models/searcheModel');
const videoCart = require('../models/cartModel');
const video_comment = require('../models/video_comment');
const video_like = require('../models/video_like');
const videoFavoriet = require('../models/videoFavoriet');
const videoViews = require('../models/videoViewes');
const videoSubscrieber = require('../models/videoSubscriebed');
const Subcatagory =require('../models/subCategory')
const mainCategorie=require('../models/mainCategorie')
const liveStreamUser=require('../models/liveStreamUsers')
const liveEvent=require('../models/liveEvent')
module.exports = {
  liveEvent,
  liveStreamUser,
  mainCategorie,
  User,
  accountType,
  userAddress,
  userPassword,
  video_information,
  video_title,
  //video_format,
  video_resolution,
  video_feedbacks,
  video_price,
  video_subscription,
  // video_upload,
  video_watch,
  videoCart,
  documentModel,
  advertiseModel,
  searchModel,
  video_like,
  video_comment,
  videoFavoriet,
  videoSubscrieber,
  videoViews,
  Subcatagory
};
