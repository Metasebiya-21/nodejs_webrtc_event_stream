const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const video_views = sequelize.define('video_views', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  views: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  video_id: {
    type: Sequelize.INTEGER,
    field: 'video_id',
    unique: true,
    reference: {
      model: 'videoInfo',
      key: 'id',
    },
  },
});
//export the video information Model
module.exports = video_views;
