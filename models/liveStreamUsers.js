const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user information model
const liveStreamUser = sequelize.define('liveStreamUser', {
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  FirstName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  MiddleName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  LastName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
  },
status:{
type:Sequelize.STRING,
allowNull:true,
defaultValue:"Not_Live"
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: Sequelize.NOW,
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: Sequelize.NOW,
  },
});
//export the userInformation Model
module.exports = liveStreamUser;
