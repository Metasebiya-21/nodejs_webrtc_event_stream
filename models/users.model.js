const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user information model
const User = sequelize.define('usersInfo', {
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  FirstName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  MiddleName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  LastName: {
    type: Sequelize.STRING,
    //allowNull: false,
  },
  username: {
    type: Sequelize.STRING,
    //allowNull: false,
  },
  sex: {
    type: Sequelize.STRING,
    //allowNull: false,
  },
  Activation_code: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: '0000',
  },
  Activation_token: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: 'none',
  },
  Account_Status: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'pending',
    value: ['pending', 'active'],
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
module.exports = User;
