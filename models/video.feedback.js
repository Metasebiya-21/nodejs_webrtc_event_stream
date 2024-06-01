const Sequelize = require('sequelize');
const sequelize = require('../util/database');
//define the user Address model
const video_feedbacks = sequelize.define("video_feedbacks",{
    id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        autoIncrement:true,
        unique:true,
        primaryKey:true
    },
    Likes:{
        type:Sequelize.INTEGER,
        defaultValue:0
    },
    dislikes:{
        type:Sequelize.INTEGER,
        defaultValue:0
    },
    userName:{
        type:Sequelize.STRING,
allowNull:false
    },
    comments:{
        type:Sequelize.STRING,
        defaultValue:' '
    },
    video_id:{
        type:Sequelize.INTEGER,
        field:'video_id',
        unique:true,
        reference:{ 
            model:'video_information',
            key: 'id'
        }
    }
});
//export the video information Model
module.exports = video_feedbacks;