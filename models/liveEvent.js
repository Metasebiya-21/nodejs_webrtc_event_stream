const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user information model
const liveEvent = sequelize.define('liveEvent', {
  Id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  eventID:{
    type:Sequelize.STRING,
    allowNull:false
  },
  producer: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  status:{
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue:"Not_Live"
  },
  eventName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  descrieption:{
type:Sequelize.STRING,
  },
  Privielage: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  
status:{
type:Sequelize.STRING,
allowNull:false,
defaultValue:"Live"
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
module.exports = liveEvent;
