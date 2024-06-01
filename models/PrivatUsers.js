const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user information model
const PrivateUser = sequelize.define('privateUser', {
  Id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  userName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  eventID:{
  type:Sequelize.STRING,
  allowNull:false
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
});
//export the userInformation Model
module.exports = PrivateUser;
