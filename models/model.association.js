//import all the user models
const video_views = require('../models/video.views');
const user_information = require('../models/users.model.js');
const user_acc_type = require('../models/usersAccountType.model.js');
const user_pass = require('../models/usersPassword.model.js');
const user_address = require('../models/usersAddress.model.js');
const video_information = require('../models/video.information');
const video_title = require('../models/video.title');
const video_resolution = require('../models/video.resolution');
const video_feedbacks = require('../models/video.feedback.js');
const video_price = require('../models/video.price');
const video_subscription = require('../models/video.subscription');
const video_watch = require('../models/video.watch');
const video_like = require('../models/video_like');
const video_comment = require('../models/video_comment');
const video_favoriet = require('../models/videoFavoriet');
const { keys } = require('underscore');
const videoSubscrieber = require('../models/videoSubscriebed');
const Subcatagory =require('../models/subCategory');
const Category=require('../models/video_catagory');
const mainCatagorie=require('../models/mainCategorie')

/* 
    Association between  
1. One to One relationship always has hasOne & belongTo association.
2. One to Many relationships always has hasMany & belongsTo association.
3. Many to Many relationships always has two belongsToMany associations.
*/
//defining the asscoiation between user Information and user password tabel
//user information is the parent tabel; users has a password
//password can't exist without a user 1:1*/
//association between cart and user information
//association between a user table and favoriet table
//user_information.hasOne(videoFavoriet,{foreignKey:{name:'user_id'}, constraints: true,  onDelete: 'CASCADE'});
//videoFavoriet.belongsTo(user_information,{foreignKey:{name:'user_id'},constraints: true,   onDelete: 'CASCADE'});
//association between a user table and favoriet table
user_information.hasOne(user_pass, {
  foreignKey: { name: 'user_id' },
  constraints: true,
  onDelete: 'CASCADE',
});
user_pass.belongsTo(user_information, {
  foreignKey: { name: 'user_id' },
  constraints: true,
  onDelete: 'CASCADE',
});
//association between a user tabel and contact address
user_information.hasOne(user_address, {
  foreignKey: { name: 'user_id' },
  constraints: true,
  onDelete: 'CASCADE',
});
user_address.belongsTo(user_information, {
  foreignKey: { name: 'user_id' },
  constraints: true,
  onDelete: 'CASCADE',
});
//userInformation pk is now a fk in the userAddress tabel
//
//user info tabel and user account tabel has 1:1 association
user_information.hasOne(user_acc_type, {
  foreignKey: { name: 'user_id' },
  onDelete: 'CASCADE',
  constraints: true,
});
user_acc_type.belongsTo(user_information, {
  foreignKey: { name: 'user_id' },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: true,
});
//userInformation pk is now a fk in the userAccountType tabel

// user info table and video information table has M:N association
user_information.belongsToMany(
  video_information,
  { through: video_watch },
  {
    foreignKey: { name: 'user_id', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    constraints: true,
  }
);
video_information.belongsToMany(
  user_information,
  { through: video_watch },
  {
    foreignKey: { name: 'video_id', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    constraints: true,
  }
);
//video information and video title has 1:1 association
video_information.hasOne(video_title, {
  foreignKey: { name: 'video_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});
video_title.belongsTo(video_information, {
  foreignKey: { name: 'video_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});
//video information and video format has 1:M association
/*video_information.hasMany(video_format, {foreignKey:{name:'video_id', allowNull:false}})
video_format.belongsTo(video_information, {foreignKey:{name:'video_id', allowNull:false}})*/
//video information and video resolution has 1 to many associations
video_information.hasMany(video_resolution, {
  foreignKey: { name: 'video_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});
video_resolution.belongsTo(video_information, {
  foreignKey: { name: 'video_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});
//video information and video feedbacks has 1 to many associations
video_information.hasMany(video_feedbacks, {
  foreignKey: { name: 'video_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});
video_feedbacks.belongsTo(video_information, {
  foreignKey: { name: 'video_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});
//video information and video price has 1 to 1 association
video_information.hasOne(video_price, {
  foreignKey: { name: 'user_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});
video_price.belongsTo(video_information, {
  foreignKey: { name: 'user_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});
//video information and video subscription has has 1:1 association
video_information.hasOne(video_subscription, {
  foreignKey: { name: 'video_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});
video_subscription.belongsTo(video_information, {
  foreignKey: { name: 'video_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});
//video info table and video uploaded table has 1:M association
video_information.hasMany(video_views, {
  foreignKey: { name: 'video_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});
video_views.belongsTo(video_information, {
  foreignKey: { name: 'video_id', allowNull: false },
  constraints: true,
  onDelete: 'CASCADE',
});

user_information.hasMany(video_like, { foreignKey: { name: 'user_id' } });
video_like.belongsTo(user_information, { foreignKey: { name: 'user_id' } });
video_like.belongsTo(video_information, { foreignKey: { name: 'video_id' } });
video_information.hasMany(video_like, { foreignKey: { name: 'video_id' } });

user_information.hasMany(videoSubscrieber, { foreignKey: { name: 'user_id' } });
videoSubscrieber.belongsTo(user_information, {
  foreignKey: { name: 'user_id' },
});
videoSubscrieber.belongsTo(video_information, {
  foreignKey: { name: 'video_id' },
});
video_information.hasMany(videoSubscrieber, {
  foreignKey: { name: 'video_id' },
});
//videoSubscrieber
user_information.hasMany(video_comment, {
  foreignKey: { name: 'user_id' },
  constraints: true,
  onDelete: 'CASCADE',
});
video_comment.belongsTo(user_information, {
  foreignKey: { name: 'user_id' },
  constraints: true,
  onDelete: 'CASCADE',
});
video_comment.belongsTo(video_information, {
  foreignKey: { name: 'video_id' },
  constraints: true,
  onDelete: 'CASCADE',
});
video_information.hasMany(video_comment, {
  foreignKey: { name: 'video_id' },
  constraints: true,
  onDelete: 'CASCADE',
});

user_information.hasMany(video_favoriet, {
  foreignKey: { name: 'user_id' },
  constraints: true,
  onDelete: 'CASCADE',
});
video_favoriet.belongsTo(user_information, {
  foreignKey: { name: 'user_id' },
  constraints: true,
  onDelete: 'CASCADE',
});
video_favoriet.belongsTo(video_information, {
  foreignKey: { name: 'video_id' },
  constraints: true,
  onDelete: 'CASCADE',
});
video_information.hasMany(video_favoriet, {
  foreignKey: { name: 'video_id' },
  constraints: true,
  onDelete: 'CASCADE',
});
Subcatagory.belongsTo(Category, {
  foreignKey: { name: 'CategoryID'},
  constraints: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Category.hasMany(Subcatagory, {
  foreignKey: { name: 'CategoryID' },
  constraints: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',

});
mainCatagorie.hasMany(mainCatagorie,{
  as:"children",
  foreignKey:{name:'parentId'},
  constraints: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',

})
mainCatagorie.belongsTo(mainCatagorie,{
  as:"parent",
  foreignKey:{name:'parentId'},
  constraints: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  


})