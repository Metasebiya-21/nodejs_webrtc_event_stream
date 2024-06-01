const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const video_subscription = sequelize.define('video_subscription', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  subscription_type: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'free',
    value: ['free', 'paid'],
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
module.exports = video_subscription;
