const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const user_address = sequelize.define('usersAddress', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  phone: {
    type: Sequelize.STRING,
    //allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
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
//export the user Address Model
module.exports = user_address;
