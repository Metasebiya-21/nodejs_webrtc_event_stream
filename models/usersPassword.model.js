const { type } = require('os');
const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user password model
const user_password = sequelize.define('usersPassword', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  password: {
    type: Sequelize.STRING,
    // allowNull: false,
    unique: true,
  },

  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    unique: true,
    reference: {
      model: 'usersInfo',
      key: 'id',
    },
  },
});
//export the user password Model
module.exports = user_password;
