const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const video_resolution = sequelize.define('video_resolution', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  resolution: {
    type: Sequelize.STRING,
    // allowNull:false
    defaultValue: ' ',
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
module.exports = video_resolution;
