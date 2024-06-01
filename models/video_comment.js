const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const video_comment = sequelize.define('video_comment', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    primaryKey: true,
  },
  text: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
  },

  video_id: {
    type: Sequelize.INTEGER,
    field: 'video_id',
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
    type: Sequelize.DATE,
  },
  updatedAt: {
    type: Sequelize.DATE,
  },
});
//export the video information Model
module.exports = video_comment;
