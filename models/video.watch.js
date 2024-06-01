const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const video_watch = sequelize.define('video_watch', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  Time_Frame: {
    type: Sequelize.STRING,
    defaultValue: '00:00:00:00',
  },
  usersInfoUserId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    reference: {
      model: 'usersInfo',
      key: 'id',
    },
  },
  videoInfoVideoId: {
    type: Sequelize.INTEGER,
    field: 'video_id',
    reference: {
      model: 'videoInfo',
      key: 'id',
    },
  },
});
//export the video information Model
module.exports = video_watch;
