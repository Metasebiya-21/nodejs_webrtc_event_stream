const { STRING } = require('sequelize');
const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const video_information = sequelize.define('videoInfo', {
  video_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  filePath: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  videoFileName:{
    type:Sequelize.STRING,
    allowNull:false
  },
  thumbnialFilePath: {
    type:Sequelize. STRING,
    allowNull: false,
  },
thumbnialFileName:{
  type:STRING,
  allowNull:false,
},

  duration: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: '00:00:00:00',
  },
  frame_per_second: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: ' '
  },
  catagory: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue:"none"
  },
});
//export the video information Model
module.exports = video_information;
