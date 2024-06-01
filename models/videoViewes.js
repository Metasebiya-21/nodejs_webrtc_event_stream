const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const videoViewe = sequelize.define('videoViews', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  video_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    // allowNull: false,
  },
});
module.exports = videoViewe;
