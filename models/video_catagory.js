const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const video_catagory = sequelize.define('video_catagory', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  catagory_Name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Description: {
    type: Sequelize.STRING,
    defaultValue:'none'
  }
});
//export the video information Model
module.exports = video_catagory;
