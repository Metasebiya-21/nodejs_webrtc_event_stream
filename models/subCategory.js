const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const video_catagory = sequelize.define('Subcatagory', {
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
  CategoryID: {
    type: Sequelize.INTEGER,
    allowNull: false,
    field:'CategoryID',
    reference: {
        model: 'video_catagory',
        key: 'id',
      },
    
  },
    Description: {
        type: Sequelize.STRING,
      
        defaultValue:'none'
      },  
});
//export the video information Model
module.exports = video_catagory;
