const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Account Type  model
const accountType = sequelize.define('usersAccountType', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  account_type: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'non-premimum',
    value: ['admin', 'non-premimum'],
    //
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
//export the user Account Type Model
module.exports = accountType;
