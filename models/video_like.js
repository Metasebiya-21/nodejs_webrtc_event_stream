const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const video_like = sequelize.define('video_like', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },

  video_id: {
    type: Sequelize.INTEGER,
    field: 'video_id',
    unique: true,
    reference: {
      model: 'videoInfo',
      key: 'id',
    },
    onUpdate: 'cascade',
    onDelete: 'cascade',
  },

  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    reference: {
      model: 'usersInfo',
      key: 'id',
    },
    onUpdate: 'cascade',
    onDelete: 'cascade',
  },
  createdAt: {
    allowNull: false,
    type: Sequelize.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: Sequelize.DATE,
  },
});
//export the video information Model
module.exports = video_like;
