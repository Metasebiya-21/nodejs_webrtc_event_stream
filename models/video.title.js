const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const video_title = sequelize.define('video_title', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  Title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Descrieption: {
    type: Sequelize.STRING(1000),
    allowNull: false,
  },
  video_id: {
    type: Sequelize.INTEGER,
    field:" video_id",
    unique: true,
    reference: {
      model: 'videoInfo',
      key: 'id',
    },
  },
});
//export the video information Model
module.exports = video_title;
