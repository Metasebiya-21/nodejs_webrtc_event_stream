const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const mainCategorie = sequelize.define('mainCatagorie', {
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
  },
});
//export the video information Model
module.exports =mainCategorie
